import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// On-demand ISR revalidation of the public menu page. Called by the admin
// cabinet right after a successful menu write (categories/products/cafe
// info/text banner/photo banner). Access is restricted to admins: the request
// must carry the caller's Supabase access token, and the server verifies the
// user's `profiles.is_admin` through RLS before invalidating the cache.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request): Promise<NextResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.startsWith('YOUR')) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    revalidateTag('menu', { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Revalidate error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
