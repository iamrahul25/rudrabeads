import { fail } from './http';
import type { Bindings } from './types';
import { parseStringArray } from './util';

/** Every stored image is WebP; the admin panel compresses photos before uploading them. */
export const IMAGE_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

/** A photo resized to 1600px and compressed as WebP is far below this. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TOO_LARGE = 'Images must be 2 MB or smaller after compression.';
export const MAX_PRODUCT_IMAGES = 12;

/** Uploads younger than this are never swept, so an admin mid-edit doesn't lose them. */
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;
const MAX_SWEEP_DELETES = 500;

const WEBP = 'image/webp';

export type ImageMeta = { contentType: string; uploadedAt: number };

/** Checks the RIFF/WEBP signature rather than trusting the upload's Content-Type. */
export function isWebp(bytes: Uint8Array) {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  return bytes.length >= 16 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' && ascii(12, 15) === 'VP8';
}

export const imageUrl = (origin: string, key: string) => `${origin}/images/${key}`;

export async function storeImage(env: Bindings, body: ArrayBuffer) {
  if (body.byteLength === 0) fail(400, 'The image is empty.');
  if (body.byteLength > MAX_IMAGE_BYTES) fail(413, IMAGE_TOO_LARGE);
  if (!isWebp(new Uint8Array(body, 0, Math.min(16, body.byteLength)))) {
    fail(415, 'Images must be uploaded as WebP. Please upload them from the admin panel, which converts them.');
  }

  // Keys are never reused, so the image behind a URL never changes and can be cached forever.
  const key = `${crypto.randomUUID()}.webp`;
  const metadata: ImageMeta = { contentType: WEBP, uploadedAt: Date.now() };
  await env.IMAGES.put(key, body, { metadata });
  return key;
}

export async function imageResponse(env: Bindings, key: string) {
  if (!IMAGE_KEY_RE.test(key)) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.IMAGES.getWithMetadata<ImageMeta>(key, {
    type: 'arrayBuffer',
    cacheTtl: 86400,
  });
  if (!value) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return new Response(value, {
    headers: {
      'Content-Type': metadata?.contentType ?? WEBP,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** Returns the first key that isn't in storage, or null when all exist. */
export async function findMissingImage(env: Bindings, keys: string[]) {
  for (const key of keys) {
    const { value } = await env.IMAGES.getWithMetadata(key, { type: 'stream' });
    if (!value) return key;
    await value.cancel();
  }
  return null;
}

export async function assertImagesExist(env: Bindings, keys: string[]) {
  const missing = await findMissingImage(env, keys);
  if (missing) fail(400, 'One of the images was not uploaded completely. Please remove it and upload it again.');
}

export async function isImageReferenced(db: D1Database, key: string) {
  const row = await db
    .prepare(
      `SELECT EXISTS (SELECT 1 FROM products WHERE images LIKE ?1)
           OR EXISTS (SELECT 1 FROM categories WHERE image_key = ?2) AS used`,
    )
    .bind(`%"${key}"%`, key)
    .first<{ used: number }>();
  return Boolean(row?.used);
}

/** Deletes images no product or category points to any more. Never throws. */
export async function deleteUnusedImages(env: Bindings, keys: (string | null | undefined)[]) {
  for (const key of new Set(keys)) {
    if (!key || !IMAGE_KEY_RE.test(key)) continue;
    try {
      if (!(await isImageReferenced(env.DB, key))) await env.IMAGES.delete(key);
    } catch (err) {
      console.error(`Failed to delete image ${key}`, err);
    }
  }
}

/** Scheduled cleanup of uploads that were never attached to a product or category. */
export async function sweepOrphanImages(env: Bindings) {
  const [products, categories] = await env.DB.batch<{ images?: string; image_key?: string }>([
    env.DB.prepare('SELECT images FROM products'),
    env.DB.prepare('SELECT image_key FROM categories WHERE image_key IS NOT NULL'),
  ]);
  const used = new Set<string>();
  for (const row of products.results) parseStringArray(row.images).forEach((key) => used.add(key));
  for (const row of categories.results) if (row.image_key) used.add(row.image_key);

  const cutoff = Date.now() - ORPHAN_GRACE_MS;
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const page = await env.IMAGES.list<ImageMeta>({ cursor, limit: 1000 });
    for (const { name, metadata } of page.keys) {
      if (deleted >= MAX_SWEEP_DELETES) return deleted;
      if (!IMAGE_KEY_RE.test(name) || used.has(name)) continue;
      if ((metadata?.uploadedAt ?? 0) > cutoff) continue;
      await env.IMAGES.delete(name);
      deleted++;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return deleted;
}
