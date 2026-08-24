import { NextResponse } from 'next/server';

// Server-side read of the public menu data.
// Uses Firestore REST API (public documents, no service account required).

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DB_ID =
  process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
  '(default)';

interface MenuData {
  cafeInfo: Record<string, unknown> | null;
  categories: Record<string, unknown>[];
  products: Record<string, unknown>[];
}

function fromFields(fields: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if ('stringValue' in value) out[key] = value.stringValue;
    else if ('integerValue' in value) out[key] = Number(value.integerValue);
    else if ('doubleValue' in value) out[key] = Number(value.doubleValue);
    else if ('booleanValue' in value) out[key] = value.booleanValue;
    else if ('arrayValue' in value) out[key] = (value.arrayValue?.values ?? []).map((v: any) => fromFields(v.mapValue?.fields ?? {}));
    else if ('mapValue' in value) out[key] = fromFields(value.mapValue?.fields ?? {});
    else if ('nullValue' in value) out[key] = null;
  }
  return out;
}

async function fetchCollection(collectionName: string): Promise<Record<string, unknown>[]> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(DB_ID)}` +
    `/documents/${collectionName}?pageSize=300&key=${API_KEY}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.documents ?? []).map((doc: any) => ({
    id: doc.name.split('/').pop(),
    ...fromFields(doc.fields ?? {}),
  }));
}

export async function GET(): Promise<NextResponse> {
  if (!API_KEY || !PROJECT_ID || API_KEY.startsWith('YOUR')) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
  }

  try {
    const [categories, products] = await Promise.all([
      fetchCollection('categories'),
      fetchCollection('products'),
    ]);

    const cafeUrl =
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(DB_ID)}` +
      `/documents/settings/cafeInfo?key=${API_KEY}`;
    const cafeRes = await fetch(cafeUrl, { cache: 'no-store' });
    const cafeJson = cafeRes.ok ? await cafeRes.json() : null;
    const cafeInfo = cafeJson?.fields ? fromFields(cafeJson.fields) : null;

    const data: MenuData = { cafeInfo, categories, products };
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (e) {
    console.error('Menu API error:', e);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}
