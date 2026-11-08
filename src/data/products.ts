import catalog from './catalog.json';
import { resolveProductImage } from './productImages';

export type CatalogProduct = (typeof catalog.products)[number];
export type CatalogCategory = (typeof catalog.categories)[number];

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
  image: number;
  images: number[];
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
  image: number;
  count: number;
  intro: string;
  productIds: string[];
};

function benefitsFromProduct(item: CatalogProduct): string[] {
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

function mapProduct(item: CatalogProduct): Product {
  const imagePath = item.image;
  const fallback = resolveProductImage(catalog.products[0]?.image);
  const primary = resolveProductImage(imagePath) ?? fallback;
  if (primary == null) {
    throw new Error(`Missing image asset for ${item.id}`);
  }

  const gallery = (item.images || [])
    .map((path) => resolveProductImage(path))
    .filter((value): value is number => value != null);

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
    images: gallery.length ? gallery : [primary],
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

export const products: Product[] = catalog.products.map(mapProduct);

export const categories: Category[] = catalog.categories.map((item) => {
  const image =
    resolveProductImage(item.image) ??
    resolveProductImage(catalog.products.find((p) => p.categoryId === item.id)?.image) ??
    products[0].image;

  return {
    id: item.id,
    name: item.name,
    image,
    count: item.productCount,
    intro: item.intro,
    productIds: item.productIds,
  };
});

export const mukhiFilters = [
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

export function formatINR(value: number | null | undefined) {
  if (value == null) return 'Price on request';
  return `₹${value.toLocaleString('en-IN')}`;
}

export function getProductById(id: string) {
  return products.find((item) => item.id === id);
}

export function getCategoryById(id: string) {
  return categories.find((item) => item.id === id);
}

export function getProductsByCategory(categoryId: string) {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  const byId = new Map(products.map((item) => [item.id, item]));
  return category.productIds
    .map((productId) => byId.get(productId))
    .filter((item): item is Product => item != null);
}

export function getFeaturedProducts() {
  return products.filter((item) => item.featured);
}

export function getProductsByMukhi(mukhi: number) {
  return products.filter((item) => item.mukhi === mukhi);
}
