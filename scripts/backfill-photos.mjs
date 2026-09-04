// One-time backfill: moves inline base64 photos stored in Postgres columns into
// Supabase Storage and rewrites the columns to the public Storage URLs.
//
// Run AFTER applying supabase/migrations/20260904100000_photo_storage.sql:
//   export SUPABASE_URL=<project url>
//   export SUPABASE_SERVICE_ROLE_KEY=<service role key>
//   npm run backfill:photos
//
// Idempotent: values that are already URLs (or empty) are skipped; uploads use
// upsert so re-runs overwrite the same objects. Mirrors the object paths used
// by lib/photo-storage.ts so later admin re-saves overwrite the same objects.

import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';

const url = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const BUCKET = 'menu-photos';
const supabase = createClient(url, serviceKey);

const isDataUri = (v) => typeof v === 'string' && /^data:image\/[^;,]+;base64,/i.test(v);
const dataUriMime = (v) => /^data:([^;,]+);base64,/.exec(v)?.[1]?.toLowerCase() ?? 'image/webp';
const dataUriBytes = (v) => Buffer.from(/^data:image\/[^;,]+;base64,(.*)$/s.exec(v)?.[1] ?? '', 'base64');
const publicUrl = (path) => `${url.replace(/\/+$/, '')}/storage/v1/object/public/${BUCKET}/${path}`;

const jobs = [
  {
    table: 'cafe_info',
    rowId: 1,
    fields: [
      ['banner', 'cafe/banner.webp'],
      ['logo', 'cafe/logo.webp'],
      ['banner_original', 'cafe/banner-original.webp'],
      ['logo_original', 'cafe/logo-original.webp'],
    ],
  },
  {
    table: 'advertising',
    rowId: 1,
    fields: [
      ['photo', 'advertising/popup.webp'],
      ['photo_original', 'advertising/popup-original.webp'],
    ],
  },
  {
    table: 'categories',
    all: true,
    path: (id, suffix) => `categories/${id}${suffix}.webp`,
    fields: [
      ['photo', ''],
      ['photo_original', '-original'],
    ],
  },
  {
    table: 'products',
    all: true,
    path: (id, suffix) => `products/${id}${suffix}.webp`,
    fields: [
      ['photo', ''],
      ['photo_original', '-original'],
    ],
  },
];

const uploadOne = async (column, dataUri, objectPath) => {
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, dataUriBytes(dataUri), {
    contentType: dataUriMime(dataUri),
    upsert: true,
  });
  if (error) throw error;
  return publicUrl(objectPath);
};

let uploaded = 0;
let updated = 0;

for (const job of jobs) {
  const query = supabase.from(job.table).select('*');
  const { data: rows, error } = job.all ? await query : await query.eq('id', job.rowId);
  if (error) throw error;
  for (const row of rows ?? []) {
    const updates = {};
    for (const [column, suffix] of job.fields) {
      const value = row[column];
      if (!isDataUri(value)) continue;
      const objectPath = job.path ? job.path(row.id, suffix) : suffix;
      updates[column] = await uploadOne(column, value, objectPath);
      uploaded += 1;
    }
    if (Object.keys(updates).length > 0) {
      const key = job.all ? { id: row.id } : { id: job.rowId };
      const { error: updErr } = await supabase.from(job.table).update(updates).eq(...Object.entries(key)[0]);
      if (updErr) throw updErr;
      updated += 1;
      console.log(`${job.table} ${key.id}: ${Object.keys(updates).join(', ')} -> storage`);
    }
  }
}

console.log(`Done: ${uploaded} object(s) uploaded, ${updated} row(s) updated.`);
