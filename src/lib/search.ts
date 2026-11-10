import { formatINR, type Product } from '@/data/products';

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name-asc', label: 'Name: A to Z' },
];

export type SearchFilters = {
  mukhi: number | null;
  categoryIds: string[];
  origins: string[];
  certifications: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
};

export const defaultFilters: SearchFilters = {
  mukhi: null,
  categoryIds: [],
  origins: [],
  certifications: [],
  minPrice: null,
  maxPrice: null,
  sort: 'relevance',
};

export const pricePresets: { min: number | null; max: number | null }[] = [
  { min: null, max: 100 },
  { min: 100, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: 25000 },
  { min: 25000, max: null },
];

export type Searchable = Pick<
  Product,
  | 'id'
  | 'name'
  | 'category'
  | 'categoryId'
  | 'mukhi'
  | 'price'
  | 'origin'
  | 'certification'
  | 'labName'
  | 'treatment'
  | 'material'
  | 'color'
  | 'usage'
  | 'shape'
  | 'beadSize'
  | 'rulingDeity'
  | 'rulingPlanet'
  | 'specs'
>;

const STOPWORDS = new Set(['a', 'an', 'and', 'the', 'for', 'of', 'with', 'in', 'to', 'on']);

/** Lowercases, drops punctuation and splits digit/letter runs ("8mm" -> "8 mm"). */
export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(query: string) {
  return normalizeText(query)
    .split(' ')
    .filter((token) => token && !STOPWORDS.has(token));
}

type Indexed = { name: string; category: string; rest: string };

function indexProduct(product: Searchable): Indexed {
  const rest = [
    product.mukhi != null ? `${product.mukhi} mukhi` : '',
    product.origin,
    product.certification,
    product.labName,
    product.treatment,
    product.material,
    product.color,
    product.usage,
    product.shape,
    product.beadSize,
    product.rulingDeity,
    product.rulingPlanet,
    ...Object.values(product.specs),
  ]
    .filter(Boolean)
    .join(' ');
  return {
    name: ` ${normalizeText(product.name)} `,
    category: ` ${normalizeText(product.category)} `,
    rest: ` ${normalizeText(rest)} `,
  };
}

/** Numbers match whole numbers only, so "5" finds "5 mukhi" but not "15 mukhi". */
function fieldMatches(field: string, token: string) {
  if (/^\d+$/.test(token)) return field.includes(` ${token} `);
  if (field.includes(token)) return true;
  return token.length > 3 && token.endsWith('s') && field.includes(token.slice(0, -1));
}

function scoreToken(index: Indexed, token: string) {
  if (fieldMatches(index.name, token)) {
    return index.name.includes(` ${token}`) ? 5 : 3;
  }
  if (fieldMatches(index.category, token)) return 2;
  if (fieldMatches(index.rest, token)) return 1;
  return 0;
}

/** Returns 0 when any token is missing (all tokens must match somewhere). */
export function scoreProduct(product: Searchable, tokens: string[]) {
  if (!tokens.length) return 1;
  const index = indexProduct(product);
  let total = 0;
  for (const token of tokens) {
    const score = scoreToken(index, token);
    if (score === 0) return 0;
    total += score;
  }
  return total;
}

export function normalizePriceRange(min: number | null, max: number | null) {
  if (min != null && max != null && min > max) return { min: max, max: min };
  return { min, max };
}

export function hasPriceFilter(filters: Pick<SearchFilters, 'minPrice' | 'maxPrice'>) {
  return filters.minPrice != null || filters.maxPrice != null;
}

function matchesFilters(product: Searchable, filters: SearchFilters) {
  if (filters.mukhi != null && product.mukhi !== filters.mukhi) return false;
  if (filters.categoryIds.length && !filters.categoryIds.includes(product.categoryId)) return false;
  if (filters.origins.length && !(product.origin && filters.origins.includes(product.origin))) {
    return false;
  }
  if (
    filters.certifications.length &&
    !(product.certification && filters.certifications.includes(product.certification))
  ) {
    return false;
  }
  if (hasPriceFilter(filters)) {
    if (product.price == null) return false;
    const { min, max } = normalizePriceRange(filters.minPrice, filters.maxPrice);
    if (min != null && product.price < min) return false;
    if (max != null && product.price > max) return false;
  }
  return true;
}

function comparePrice(a: number | null, b: number | null, direction: 1 | -1) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * direction;
}

export function searchProducts<T extends Searchable>(
  items: readonly T[],
  query: string,
  filters: SearchFilters,
): T[] {
  const tokens = tokenize(query);
  const ranked = items
    .map((product, order) => ({ product, order, score: scoreProduct(product, tokens) }))
    .filter((entry) => entry.score > 0 && matchesFilters(entry.product, filters));

  ranked.sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return comparePrice(a.product.price, b.product.price, 1) || a.order - b.order;
      case 'price-desc':
        return comparePrice(a.product.price, b.product.price, -1) || a.order - b.order;
      case 'name-asc':
        return a.product.name.localeCompare(b.product.name) || a.order - b.order;
      default:
        return b.score - a.score || a.order - b.order;
    }
  });

  return ranked.map((entry) => entry.product);
}

export function formatPriceRange(min: number | null, max: number | null) {
  const range = normalizePriceRange(min, max);
  if (range.min != null && range.max != null) {
    return `${formatINR(range.min)} – ${formatINR(range.max)}`;
  }
  if (range.max != null) return `Up to ${formatINR(range.max)}`;
  if (range.min != null) return `${formatINR(range.min)} & above`;
  return 'Any price';
}

/** Digits only; empty input means "no bound". */
export function parsePriceInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

export type ActiveFilter = { key: string; label: string; clear: (f: SearchFilters) => SearchFilters };

export function describeActiveFilters(
  filters: SearchFilters,
  categoryName: (id: string) => string,
): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (hasPriceFilter(filters)) {
    active.push({
      key: 'price',
      label: formatPriceRange(filters.minPrice, filters.maxPrice),
      clear: (f) => ({ ...f, minPrice: null, maxPrice: null }),
    });
  }
  for (const id of filters.categoryIds) {
    active.push({
      key: `category:${id}`,
      label: categoryName(id),
      clear: (f) => ({ ...f, categoryIds: f.categoryIds.filter((value) => value !== id) }),
    });
  }
  for (const origin of filters.origins) {
    active.push({
      key: `origin:${origin}`,
      label: origin,
      clear: (f) => ({ ...f, origins: f.origins.filter((value) => value !== origin) }),
    });
  }
  for (const cert of filters.certifications) {
    active.push({
      key: `cert:${cert}`,
      label: cert,
      clear: (f) => ({ ...f, certifications: f.certifications.filter((value) => value !== cert) }),
    });
  }
  return active;
}

/** Mukhi and sort have their own controls, so they don't count as sheet filters. */
export function countSheetFilters(filters: SearchFilters) {
  return (
    (hasPriceFilter(filters) ? 1 : 0) +
    filters.categoryIds.length +
    filters.origins.length +
    filters.certifications.length
  );
}

export function facetValues<T extends Searchable>(items: readonly T[], key: 'origin' | 'certification') {
  return [...new Set(items.map((item) => item[key]).filter((value): value is string => !!value))].sort();
}

export function toggleValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
