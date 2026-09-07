import { NextResponse } from 'next/server';

// Server-side proxy to Google's public translation endpoint (client=gtx).
// No API key needed; suitable for a prototype. If it stops working, the UI
// falls back to the original text.
const SUPPORTED = ['uk', 'hu', 'en'];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const text: string = typeof body?.text === 'string' ? body.text : '';
    const target: string = typeof body?.target === 'string' ? body.target : '';
    if (!text.trim() || !SUPPORTED.includes(target)) {
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
