import type { ApiCatalog, ApiCategory, ApiProduct } from '../../src/shared/api';
import { fail } from './http';
import { assertImagesExist, imageUrl } from './images';
import type { Bindings } from './types';
import { parseStringArray, parseStringRecord, slugify, toIso, uniqueId } from './util';
import type { CategoryInput, ProductInput } from './validation';

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  category_name: string;
  price: number | null;
  price_unit: string | null;
  min_order_qty: number | null;
  min_order_unit: string | null;
  mukhi: number | null;
  origin: string | null;
  bead_size: string | null;
  certification: string | null;
  lab_name: string | null;
  treatment: string | null;
  ruling_deity: string | null;
  ruling_planet: string | null;
  usage: string | null;
  shape: string | null;
  color: string | null;
  material: string | null;
  specs: string;
  description: string;
  images: string;
  in_stock: number;
  featured: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
};

type CategoryRow = {
  id: string;
  name: string;
  intro: string;
  image_key: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
};

const PRODUCT_SELECT = `SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id`;
const PRODUCT_ORDER = `ORDER BY c.sort_order, c.name, p.sort_order, p.created_at`;

function toProduct(row: ProductRow, origin: string): ApiProduct {
  const imageKeys = parseStringArray(row.images);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    categoryId: row.category_id,
    category: row.category_name,
    price: row.price,
    priceUnit: row.price_unit,
    minOrderQty: row.min_order_qty,
    minOrderUnit: row.min_order_unit,
    mukhi: row.mukhi,
    origin: row.origin,
    beadSize: row.bead_size,
    certification: row.certification,
    labName: row.lab_name,
    treatment: row.treatment,
    rulingDeity: row.ruling_deity,
    rulingPlanet: row.ruling_planet,
    usage: row.usage,
    shape: row.shape,
    color: row.color,
    material: row.material,
    specs: parseStringRecord(row.specs),
    description: row.description,
    images: imageKeys.map((key) => imageUrl(origin, key)),
    imageKeys,
    inStock: row.in_stock === 1,
    featured: row.featured === 1,
    sortOrder: row.sort_order,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listCatalog(db: D1Database, origin: string): Promise<ApiCatalog> {
  const [categoryResult, productResult] = await db.batch<CategoryRow | ProductRow>([
    db.prepare('SELECT * FROM categories ORDER BY sort_order, name'),
    db.prepare(`${PRODUCT_SELECT} ${PRODUCT_ORDER}`),
  ]);
  const products = (productResult.results as ProductRow[]).map((row) => toProduct(row, origin));
  const categories = (categoryResult.results as CategoryRow[]).map((row): ApiCategory => {
    const items = products.filter((p) => p.categoryId === row.id);
    const fallback = items.find((p) => p.images.length)?.images[0] ?? null;
    return {
      id: row.id,
      name: row.name,
      intro: row.intro,
      image: row.image_key ? imageUrl(origin, row.image_key) : fallback,
      imageKey: row.image_key,
      productIds: items.map((p) => p.id),
      count: items.length,
      sortOrder: row.sort_order,
    };
  });
  return { categories, products, generatedAt: new Date().toISOString() };
}

export async function getProduct(db: D1Database, id: string, origin: string) {
  const row = await db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).bind(id).first<ProductRow>();
  return row ? toProduct(row, origin) : null;
}

async function assertCategory(db: D1Database, id: string) {
  const exists = await db.prepare('SELECT 1 FROM categories WHERE id = ?').bind(id).first();
  if (!exists) fail(400, 'The chosen category no longer exists.');
}

async function nextSku(db: D1Database) {
  const { results } = await db.prepare(`SELECT sku FROM products WHERE sku LIKE 'RB-%'`).all<{ sku: string }>();
  const max = results.reduce((highest, { sku }) => {
    const n = Number(sku.slice(3));
    return Number.isInteger(n) && n > highest ? n : highest;
  }, 0);
  return `RB-${String(max + 1).padStart(3, '0')}`;
}

async function nextSortOrder(db: D1Database, categoryId: string) {
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM products WHERE category_id = ?')
    .bind(categoryId)
    .first<{ next: number }>();
  return row?.next ?? 1;
}

/** Column values shared by insert and update, so the two can't drift apart. */
function productColumns(input: ProductInput): [string, string | number | null][] {
  return [
    ['name', input.name],
    ['category_id', input.categoryId],
    ['price', input.price],
    ['price_unit', input.priceUnit],
    ['min_order_qty', input.minOrderQty],
    ['min_order_unit', input.minOrderUnit],
    ['mukhi', input.mukhi],
    ['origin', input.origin],
    ['bead_size', input.beadSize],
    ['certification', input.certification],
    ['lab_name', input.labName],
    ['treatment', input.treatment],
    ['ruling_deity', input.rulingDeity],
    ['ruling_planet', input.rulingPlanet],
    ['usage', input.usage],
    ['shape', input.shape],
    ['color', input.color],
    ['material', input.material],
    ['specs', JSON.stringify(input.specs)],
    ['description', input.description],
    ['images', JSON.stringify(input.images)],
    ['in_stock', input.inStock ? 1 : 0],
    ['featured', input.featured ? 1 : 0],
  ];
}

export async function createProduct(env: Bindings, input: ProductInput, origin: string) {
  const db = env.DB;
  await assertCategory(db, input.categoryId);
  await assertImagesExist(env, input.images);

  const id = await uniqueId(db, 'products', slugify(input.name, 'product'));
  const now = Date.now();
  const columns: [string, string | number | null][] = [
    ['id', id],
    ['sku', input.sku ?? (await nextSku(db))],
    ['sort_order', await nextSortOrder(db, input.categoryId)],
    ['created_at', now],
    ['updated_at', now],
    ...productColumns(input),
  ];
  await db
    .prepare(
      `INSERT INTO products (${columns.map(([name]) => name).join(', ')})
       VALUES (${columns.map(() => '?').join(', ')})`,
    )
    .bind(...columns.map(([, value]) => value))
    .run();
  return (await getProduct(db, id, origin))!;
}

/** Returns the saved product and the image keys it no longer uses. */
export async function updateProduct(env: Bindings, id: string, input: ProductInput, origin: string) {
  const db = env.DB;
  const current = await db
    .prepare('SELECT sku, category_id, images, sort_order FROM products WHERE id = ?')
    .bind(id)
    .first<Pick<ProductRow, 'sku' | 'category_id' | 'images' | 'sort_order'>>();
  if (!current) fail(404, 'This product no longer exists.');
  await assertCategory(db, input.categoryId);

  const oldKeys = parseStringArray(current.images);
  await assertImagesExist(
    env,
    input.images.filter((key) => !oldKeys.includes(key)),
  );

  const sortOrder =
    current.category_id === input.categoryId ? current.sort_order : await nextSortOrder(db, input.categoryId);
  const columns: [string, string | number | null][] = [
    ['sku', input.sku ?? current.sku],
    ['sort_order', sortOrder],
    ['updated_at', Date.now()],
    ...productColumns(input),
  ];
  await db
    .prepare(`UPDATE products SET ${columns.map(([name]) => `${name} = ?`).join(', ')} WHERE id = ?`)
    .bind(...columns.map(([, value]) => value), id)
    .run();

  return {
    product: (await getProduct(db, id, origin))!,
    removedImages: oldKeys.filter((key) => !input.images.includes(key)),
  };
}

export async function deleteProduct(env: Bindings, id: string) {
  const row = await env.DB.prepare('DELETE FROM products WHERE id = ? RETURNING images')
    .bind(id)
    .first<{ images: string }>();
  if (!row) fail(404, 'This product no longer exists.');
  return parseStringArray(row.images);
}

export async function createCategory(env: Bindings, input: CategoryInput) {
  const db = env.DB;
  if (input.imageKey) await assertImagesExist(env, [input.imageKey]);
  const duplicate = await db
    .prepare('SELECT 1 FROM categories WHERE lower(name) = lower(?)')
    .bind(input.name)
    .first();
  if (duplicate) fail(409, `A category named “${input.name}” already exists.`);

  const id = await uniqueId(db, 'categories', slugify(input.name, 'category'));
  const sort = await db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories')
    .first<{ next: number }>();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO categories (id, name, intro, image_key, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.name, input.intro, input.imageKey, sort?.next ?? 1, now, now)
    .run();
  return id;
}

export async function updateCategory(env: Bindings, id: string, input: CategoryInput) {
  const db = env.DB;
  const current = await db
    .prepare('SELECT image_key FROM categories WHERE id = ?')
    .bind(id)
    .first<{ image_key: string | null }>();
  if (!current) fail(404, 'This category no longer exists.');
  if (input.imageKey && input.imageKey !== current.image_key) {
    await assertImagesExist(env, [input.imageKey]);
  }
  const duplicate = await db
    .prepare('SELECT 1 FROM categories WHERE lower(name) = lower(?) AND id != ?')
    .bind(input.name, id)
    .first();
  if (duplicate) fail(409, `A category named “${input.name}” already exists.`);

  await db
    .prepare('UPDATE categories SET name = ?, intro = ?, image_key = ?, updated_at = ? WHERE id = ?')
    .bind(input.name, input.intro, input.imageKey, Date.now(), id)
    .run();
  return current.image_key !== input.imageKey ? [current.image_key] : [];
}

export async function deleteCategory(env: Bindings, id: string) {
  const db = env.DB;
  const count = await db
    .prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?')
    .bind(id)
    .first<{ n: number }>();
  if (count && count.n > 0) {
    fail(
      409,
      `This category still has ${count.n} ${count.n === 1 ? 'product' : 'products'}. Move or delete them first.`,
    );
  }
  const row = await db
    .prepare('DELETE FROM categories WHERE id = ? RETURNING image_key')
    .bind(id)
    .first<{ image_key: string | null }>();
  if (!row) fail(404, 'This category no longer exists.');
  return [row.image_key];
}

export async function reorderCategories(db: D1Database, ids: string[]) {
  const now = Date.now();
  await db.batch(
    ids.map((id, index) =>
      db.prepare('UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?').bind(index + 1, now, id),
    ),
  );
}
