/**
 * One-time import of the bundled catalog (src/data/catalog.json + assets/products/catalog/*.webp)
 * into D1 and KV. Safe to re-run: image keys come from a hash of the file, and rows use
 * INSERT OR IGNORE, so products edited in the admin panel are never overwritten.
 *
 *   npm run seed:local    # for `npm run dev`
 *   npm run seed:remote   # for the deployed worker
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const target = process.argv.includes('--remote') ? '--remote' : process.argv.includes('--local') ? '--local' : null;
if (!target) {
  console.error('Usage: node scripts/seed.mjs --local | --remote');
  process.exit(1);
}

const workerDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(workerDir, '..');
const outDir = resolve(workerDir, '.seed');
const catalog = JSON.parse(readFileSync(resolve(repoDir, 'src/data/catalog.json'), 'utf8'));

const now = Date.now();
const images = new Map(); // asset path -> { key, value, contentType }

/** Same file -> same key, formatted like the worker's random UUID keys. */
function imageKey(assetPath) {
  if (!assetPath) return null;
  const cached = images.get(assetPath);
  if (cached) return cached.key;
  const bytes = readFileSync(resolve(repoDir, assetPath));
  // The worker only stores WebP, so every bundled image must already be one.
  const isWebp = bytes.toString('latin1', 0, 4) === 'RIFF' && bytes.toString('latin1', 8, 12) === 'WEBP';
  if (extname(assetPath).toLowerCase() !== '.webp' || !isWebp) {
    throw new Error(`Not a WebP image: ${assetPath}. Convert it to WebP before seeding.`);
  }
  const hex = createHash('sha256').update(bytes).digest('hex');
  const key = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}.webp`;
  images.set(assetPath, { key, value: bytes.toString('base64'), contentType: 'image/webp' });
  return key;
}

const sql = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
};

const insert = (table, row) =>
  `INSERT OR IGNORE INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(sql).join(', ')});`;

const statements = [];

catalog.categories.forEach((category, index) => {
  statements.push(
    insert('categories', {
      id: category.id,
      name: category.name,
      intro: category.intro ?? '',
      image_key: imageKey(category.image),
      sort_order: index + 1,
      created_at: now,
      updated_at: now,
    }),
  );
});

catalog.products.forEach((product, index) => {
  const paths = [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))];
  const specs = Object.fromEntries(
    Object.entries(product.specs ?? {}).filter(([, value]) => typeof value === 'string' && value),
  );
  statements.push(
    insert('products', {
      id: product.id,
      sku: product.sku ?? '',
      name: product.name,
      category_id: product.categoryId,
      price: product.price,
      price_unit: product.priceUnit,
      min_order_qty: product.minOrderQty,
      min_order_unit: product.minOrderUnit,
      mukhi: product.mukhi,
      origin: product.origin,
      bead_size: product.beadSize,
      certification: product.certification,
      lab_name: product.labName,
      treatment: product.treatment,
      ruling_deity: product.rulingDeity,
      ruling_planet: product.rulingPlanet,
      usage: product.usage,
      shape: product.shape,
      color: product.color,
      material: product.material,
      specs: JSON.stringify(specs),
      description: product.description ?? '',
      images: JSON.stringify(paths.map(imageKey)),
      in_stock: product.inStock !== false,
      featured: Boolean(product.featured),
      sort_order: product.order ?? index + 1,
      created_at: now + index,
      updated_at: now + index,
    }),
  );
});

mkdirSync(outDir, { recursive: true });
const kvFile = resolve(outDir, 'images.json');
const sqlFile = resolve(outDir, 'seed.sql');
writeFileSync(
  kvFile,
  JSON.stringify(
    [...images.values()].map(({ key, value, contentType }) => ({
      key,
      value,
      base64: true,
      metadata: { contentType, uploadedAt: now },
    })),
  ),
);
writeFileSync(sqlFile, `${statements.join('\n')}\n`);

console.log(
  `Prepared ${images.size} images, ${catalog.categories.length} categories and ${catalog.products.length} products.`,
);

function wrangler(args) {
  console.log(`\n> wrangler ${args.join(' ')}`);
  const result = spawnSync(`npx wrangler ${args.join(' ')}`, { cwd: workerDir, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`wrangler ${args[0]} ${args[1]} failed.`);
    process.exit(result.status ?? 1);
  }
}

// Images first, so no product ever points at an image that isn't stored yet.
wrangler(['kv', 'bulk', 'put', '.seed/images.json', '--binding', 'IMAGES', target]);
wrangler(['d1', 'execute', 'rudrabeads', '--file', '.seed/seed.sql', target, '--yes']);
console.log('\nSeed complete.');
