import type { ApiCatalog, ApiProduct } from '@/shared/api';

import catalog from './catalog.json';
import { resolveProductImage } from './productImages';

export type CatalogProduct = (typeof catalog.products)[number];
export type CatalogCategory = (typeof catalog.categories)[number];

/** A bundled asset (`require` id) or a remote image URL from the API. */
export type ImageRef = number | string;

export type Product = {
  id: string;
  sku: string;
  name: string;
  mukhi: number | null;
  price: number | null;
  originalPrice: number | null;
  priceUnit: string | null;
  priceDisplay: string | null;
  minOrderQty: number | null;
  minOrderUnit: string | null;
  rating: number;
  reviews: number;
  image: ImageRef | null;
  images: ImageRef[];
  category: string;
  categoryId: string;
  origin: string | null;
  beadSize: string | null;
  certification: string | null;
  labName: string | null;
  treatment: string | null;
  rulingDeity: string | null;
  rulingPlanet: string | null;
  usage: string | null;
  shape: string | null;
  color: string | null;
  material: string | null;
  specs: Record<string, string>;
  benefits: string[];
  description: string;
  featured: boolean;
  inStock: boolean;
};

export type Category = {
  id: string;
  name: string;
  image: ImageRef | null;
  count: number;
  intro: string;
  productIds: string[];
};

export type Catalog = { products: Product[]; categories: Category[] };

type BenefitSource = Pick<
  Product,
  'rulingDeity' | 'rulingPlanet' | 'certification' | 'beadSize' | 'origin' | 'usage'
>;

function benefitsFromProduct(item: BenefitSource): string[] {
  const values = [
    item.rulingDeity ? `Ruling deity: ${item.rulingDeity}` : null,
    item.rulingPlanet ? `Ruling planet: ${item.rulingPlanet}` : null,
    item.certification || null,
    item.beadSize ? `Bead size ${item.beadSize}` : null,
    item.origin ? `Origin: ${item.origin}` : null,
    item.usage || null,
  ].filter(Boolean) as string[];
  return values.slice(0, 4);
}

export function formatINR(value: number | null | undefined) {
  if (value == null) return 'Price on request';
  return `₹${value.toLocaleString('en-IN')}`;
}

const priceDisplay = (price: number | null) => (price == null ? null : formatINR(price));

function mapBundledProduct(item: CatalogProduct): Product {
  const resolved = ((item.images || []) as string[])
    .map((path) => resolveProductImage(path))
    .filter((value): value is number => value != null);
  const primary = resolveProductImage(item.image) ?? resolved[0] ?? null;
  const gallery = primary != null ? [primary, ...resolved.filter((value) => value !== primary)] : resolved;

  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    mukhi: item.mukhi,
    price: item.price,
    originalPrice: null,
    priceUnit: item.priceUnit,
    priceDisplay: item.priceDisplay,
    minOrderQty: item.minOrderQty,
    minOrderUnit: item.minOrderUnit,
    rating: 5,
    reviews: 0,
    image: primary,
    images: gallery,
    category: item.category,
    categoryId: item.categoryId,
    origin: item.origin,
    beadSize: item.beadSize,
    certification: item.certification,
    labName: item.labName,
    treatment: item.treatment,
    rulingDeity: item.rulingDeity,
    rulingPlanet: item.rulingPlanet,
    usage: item.usage,
    shape: item.shape,
    color: item.color,
    material: item.material,
    specs: Object.fromEntries(
      Object.entries(item.specs).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    ),
    benefits: benefitsFromProduct(item),
    description: item.description,
    featured: item.featured,
    inStock: item.inStock,
  };
}

export function mapApiProduct(item: ApiProduct): Product {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    mukhi: item.mukhi,
    price: item.price,
    originalPrice: null,
    priceUnit: item.priceUnit,
    priceDisplay: priceDisplay(item.price),
    minOrderQty: item.minOrderQty,
    minOrderUnit: item.minOrderUnit,
    rating: 5,
    reviews: 0,
    image: item.images[0] ?? null,
    images: item.images,
    category: item.category,
    categoryId: item.categoryId,
    origin: item.origin,
    beadSize: item.beadSize,
    certification: item.certification,
    labName: item.labName,
    treatment: item.treatment,
    rulingDeity: item.rulingDeity,
    rulingPlanet: item.rulingPlanet,
    usage: item.usage,
    shape: item.shape,
    color: item.color,
    material: item.material,
    specs: item.specs ?? {},
    benefits: benefitsFromProduct(item),
    description: item.description,
    featured: item.featured,
    inStock: item.inStock,
  };
}

/** Rough shape check for API responses and cached copies of them. */
export function isApiCatalog(value: unknown): value is ApiCatalog {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ApiCatalog>;
  return (
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.categories) &&
    candidate.products.every(
      (p) => p && typeof p.id === 'string' && typeof p.name === 'string' && Array.isArray(p.images),
    ) &&
    candidate.categories.every((c) => c && typeof c.id === 'string' && Array.isArray(c.productIds))
  );
}

export function catalogFromApi(api: ApiCatalog): Catalog {
  return {
    products: api.products.map(mapApiProduct),
    categories: api.categories.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      count: item.count,
      intro: item.intro,
      productIds: item.productIds,
    })),
  };
}

const bundledProducts = catalog.products.map(mapBundledProduct);

/** The catalogue shipped inside the app, used until (or whenever) the API can't be reached. */
export const bundledCatalog: Catalog = {
  products: bundledProducts,
  categories: catalog.categories.map((item) => ({
    id: item.id,
    name: item.name,
    image:
      resolveProductImage(item.image) ??
      bundledProducts.find((p) => p.categoryId === item.id && p.image != null)?.image ??
      null,
    count: item.productCount,
    intro: item.intro,
    productIds: item.productIds,
  })),
};

export type ShopByMukhiItem = {
  mukhi: number;
  name: string;
  image: number | null;
};

export const shopByMukhi: ShopByMukhiItem[] = catalog.shopByMukhi.map((item) => ({
  mukhi: item.mukhi,
  name: item.name,
  image: resolveProductImage(item.image) ?? null,
}));

export function getMukhiFilters(products: Product[]) {
  return [
    'All',
    ...Array.from(
      new Set(
        products
          .map((item) => item.mukhi)
          .filter((value): value is number => typeof value === 'number')
          .sort((a, b) => a - b)
          .map((value) => `${value} Mukhi`)
      )
    ),
  ];
}

export function findProduct(source: Catalog, id: string) {
  return source.products.find((item) => item.id === id);
}

export function findCategory(source: Catalog, id: string) {
  return source.categories.find((item) => item.id === id);
}

export function productsInCategory(source: Catalog, categoryId: string) {
  const category = findCategory(source, categoryId);
  if (!category) return [];
  const byId = new Map(source.products.map((item) => [item.id, item]));
  return category.productIds
    .map((productId) => byId.get(productId))
    .filter((item): item is Product => item != null);
}
