export function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug || fallback;
}

/** First free id among `base`, `base-2`, `base-3`, ... */
export async function uniqueId(db: D1Database, table: 'products' | 'categories', base: string) {
  for (let n = 1; n <= 200; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).bind(candidate).first();
    if (!taken) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function randomHex(bytes: number) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return [...values].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function parseStringArray(json: string | null | undefined): string[] {
  try {
    const value: unknown = JSON.parse(json || '[]');
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function parseStringRecord(json: string | null | undefined): Record<string, string> {
  try {
    const value: unknown = JSON.parse(json || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    );
  } catch {
    return {};
  }
}

export const placeholders = (count: number) => Array.from({ length: count }, () => '?').join(', ');

export const toIso = (ms: number) => new Date(ms).toISOString();

/** Escapes LIKE wildcards; use with `ESCAPE '\'`. */
export const likePattern = (value: string) => `%${value.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
