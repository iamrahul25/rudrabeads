import { products } from '@/data/products';
import {
  countSheetFilters,
  defaultFilters,
  describeActiveFilters,
  facetValues,
  formatPriceRange,
  normalizeText,
  parsePriceInput,
  searchProducts,
  tokenize,
  type SearchFilters,
} from '@/lib/search';

const run = (query: string, filters: Partial<SearchFilters> = {}) =>
  searchProducts(products, query, { ...defaultFilters, ...filters });

const ids = (query: string, filters: Partial<SearchFilters> = {}) =>
  run(query, filters).map((product) => product.id);

describe('text search', () => {
  it('returns the whole catalogue for an empty query', () => {
    expect(run('')).toHaveLength(products.length);
    expect(run('   ')).toHaveLength(products.length);
  });

  it('normalizes punctuation and digit/letter runs', () => {
    expect(normalizeText('8mm Karungali-Mala!')).toBe('8 mm karungali mala');
    expect(tokenize('5mukhi mala for meditation')).toEqual(['5', 'mukhi', 'mala', 'meditation']);
  });

  it('is case-insensitive', () => {
    expect(ids('KARUNGALI')).toEqual(ids('karungali'));
    expect(ids('karungali').length).toBeGreaterThanOrEqual(7);
  });

  it('requires every word to match and ranks name matches first', () => {
    const results = run('5 mukhi mala');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.mukhi === 5)).toBe(true);
    const inName = results.map((product) => /mala/i.test(product.name));
    const firstSpecOnly = inName.indexOf(false);
    expect(inName[0]).toBe(true);
    if (firstSpecOnly !== -1) expect(inName.slice(firstSpecOnly).every((value) => !value)).toBe(true);
  });

  it('matches numbers as whole numbers only', () => {
    const results = run('5 mukhi');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.mukhi === 5)).toBe(true);
    expect(ids('1 mukhi')).not.toContain('16-mukhi-nepali-rudraksha');
  });

  it('treats "5mukhi" the same as "5 mukhi"', () => {
    expect(ids('5mukhi')).toEqual(ids('5 mukhi'));
  });

  it('matches simple plurals', () => {
    expect(ids('bracelets')).toEqual(expect.arrayContaining(ids('bracelet')));
    expect(ids('malas').length).toBeGreaterThan(0);
  });

  it('searches origin, deity and planet fields', () => {
    expect(run('indonesia').every((p) => /indonesia/i.test(`${p.name} ${p.category} ${p.origin}`))).toBe(true);
    expect(ids('hanuman')).toEqual(expect.arrayContaining(['11-mukhi-nepali-rudraksha']));
    expect(ids('saturn')).toEqual(expect.arrayContaining(['7-mukhi-nepali-rudraksha']));
  });

  it('ranks name matches above spec-only matches', () => {
    const results = ids('gauri shankar');
    expect(results[0]).toBe('gauri-shankar-rudraksha');
  });

  it('returns nothing for unknown words', () => {
    expect(run('xyzzy')).toHaveLength(0);
    expect(run('karungali xyzzy')).toHaveLength(0);
  });
});

describe('price filtering', () => {
  it('keeps products inside an inclusive range', () => {
    const results = run('', { minPrice: 100, maxPrice: 1000 });
    expect(results.length).toBeGreaterThan(0);
    for (const product of results) {
      expect(product.price).not.toBeNull();
      expect(product.price!).toBeGreaterThanOrEqual(100);
      expect(product.price!).toBeLessThanOrEqual(1000);
    }
    expect(results.map((p) => p.price)).toEqual(expect.arrayContaining([100, 1000]));
  });

  it('supports min-only and max-only bounds', () => {
    expect(run('', { minPrice: 25000 }).every((p) => p.price! >= 25000)).toBe(true);
    expect(run('', { maxPrice: 50 }).every((p) => p.price! <= 50)).toBe(true);
    expect(ids('', { minPrice: 25000 })).toContain('16-mukhi-nepali-rudraksha');
  });

  it('swaps an inverted range instead of returning nothing', () => {
    expect(ids('', { minPrice: 1000, maxPrice: 100 })).toEqual(ids('', { minPrice: 100, maxPrice: 1000 }));
  });

  it('excludes "price on request" products once a price bound is set', () => {
    expect(ids('')).toContain('21-mukhi-rudraksha');
    expect(ids('', { maxPrice: 1_000_000 })).not.toContain('21-mukhi-rudraksha');
  });

  it('combines with text search', () => {
    const results = run('nepali', { maxPrice: 200 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.price! <= 200 && /nepal/i.test(`${p.name} ${p.origin}`))).toBe(true);
  });

  it('parses price inputs', () => {
    expect(parsePriceInput('₹1,000')).toBe(1000);
    expect(parsePriceInput('')).toBeNull();
    expect(parsePriceInput('abc')).toBeNull();
  });

  it('formats ranges', () => {
    expect(formatPriceRange(100, 1000)).toBe('₹100 – ₹1,000');
    expect(formatPriceRange(null, 100)).toBe('Up to ₹100');
    expect(formatPriceRange(25000, null)).toBe('₹25,000 & above');
  });
});

describe('facet filters', () => {
  it('filters by mukhi', () => {
    const results = run('', { mukhi: 14 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.mukhi === 14)).toBe(true);
  });

  it('filters by category (OR within the facet)', () => {
    const results = run('', { categoryIds: ['karungali-mala', 'karungali-bracelet'] });
    expect(results).toHaveLength(7);
  });

  it('filters by origin and certification (AND across facets)', () => {
    const results = run('', { origins: ['Nepal'], certifications: ['Lab Certified'] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.origin === 'Nepal' && p.certification === 'Lab Certified')).toBe(true);
  });

  it('lists available facet values from the catalogue', () => {
    expect(facetValues(products, 'origin')).toEqual(['Indonesia', 'Nepal']);
    expect(facetValues(products, 'certification')).toEqual(['Lab Certified', 'Not Certified']);
  });

  it('describes and clears active filters', () => {
    const filters: SearchFilters = {
      ...defaultFilters,
      minPrice: 100,
      categoryIds: ['rudraksha-mala'],
      origins: ['Nepal'],
    };
    const active = describeActiveFilters(filters, () => 'Rudraksha Mala');
    expect(active.map((f) => f.label)).toEqual(['₹100 & above', 'Rudraksha Mala', 'Nepal']);
    expect(countSheetFilters(filters)).toBe(3);
    const cleared = active.reduce((acc, f) => f.clear(acc), filters);
    expect(countSheetFilters(cleared)).toBe(0);
  });
});

describe('sorting', () => {
  const prices = (key: SearchFilters['sort']) => run('', { sort: key }).map((p) => p.price);

  it('sorts by price ascending with "price on request" last', () => {
    const list = prices('price-asc');
    const priced = list.filter((p): p is number => p != null);
    expect(priced).toEqual([...priced].sort((a, b) => a - b));
    expect(list.slice(priced.length).every((p) => p == null)).toBe(true);
  });

  it('sorts by price descending', () => {
    const priced = prices('price-desc').filter((p): p is number => p != null);
    expect(priced).toEqual([...priced].sort((a, b) => b - a));
    expect(priced[0]).toBe(100009);
  });

  it('sorts by name', () => {
    const names = run('', { sort: 'name-asc' }).map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
