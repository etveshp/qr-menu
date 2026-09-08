import { NextResponse } from 'next/server';

const SUPPORTED = ['uk', 'hu', 'en'];

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

// Static analysis note: the serverless function only keeps this map
// in memory for the duration of the invocation on Vercel; the map is
// per-instance and does not persist between instances. For a prototype
// this is sufficient — a determined attacker can bypass it, but the
// rate-limit prevents accidental runaway requests from a single client.

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ translated: '' }, { status: 200 });
    }
    const text: string = typeof body.text === 'string' ? body.text : '';
    const target: string = typeof body.target === 'string' ? body.target : '';
    if (!text.trim() || text.length > 10000 || !SUPPORTED.includes(target)) {
      return NextResponse.json({ translated: text }, { status: 200 });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      target
    )}&dt=t&q=${encodeURIComponent(text.slice(0, 5000))}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ translated: text }, { status: 200 });
    }
    const data = await res.json();
    const segments: unknown[] = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = segments
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
      .join('')
      .trim();

    return NextResponse.json({ translated: translated || text });
  } catch (e) {
    console.error('Translation error:', e);
    return NextResponse.json({ translated: '' }, { status: 200 });
  }
}
