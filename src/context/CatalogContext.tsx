import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import {
  bundledCatalog,
  catalogFromApi,
  findCategory,
  getMukhiFilters,
  isApiCatalog,
  productsInCategory,
  type Catalog,
  type Category,
  type Product,
} from '@/data/products';
import { fetchCatalog, isApiConfigured } from '@/lib/api';
import { loadJSON, saveJSON } from '@/lib/storage';

const CACHE_KEY = 'catalog';
/** Coming back to the app refreshes the catalogue at most this often. */
const REFRESH_INTERVAL_MS = 60 * 1000;

/** `bundled` = shipped with the app, `cache` = last API copy on this device, `live` = fetched this session. */
export type CatalogSource = 'bundled' | 'cache' | 'live';

type CatalogContextValue = {
  hydrated: boolean;
  source: CatalogSource;
  products: Product[];
  categories: Category[];
  mukhiFilters: string[];
  getProductById: (id: string) => Product | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  getProductsByMukhi: (mukhi: number) => Product[];
  getFeaturedProducts: () => Product[];
  /** Fetches the latest catalogue; resolves to false when offline or the API fails. */
  refresh: () => Promise<boolean>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(bundledCatalog);
  const [source, setSource] = useState<CatalogSource>('bundled');
  const [hydrated, setHydrated] = useState(false);
  const lastFetchRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!isApiConfigured) return false;
    lastFetchRef.current = Date.now();
    try {
      const api = await fetchCatalog();
      if (!isApiCatalog(api)) return false;
      setCatalog(catalogFromApi(api));
      setSource('live');
      saveJSON(CACHE_KEY, api);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    loadJSON(CACHE_KEY).then((stored) => {
      if (!alive) return;
      if (isApiConfigured && isApiCatalog(stored)) {
        setCatalog(catalogFromApi(stored));
        setSource('cache');
      }
      setHydrated(true);
      refresh();
    });
    return () => {
      alive = false;
    };
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastFetchRef.current > REFRESH_INTERVAL_MS) refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(() => {
    const byId = new Map(catalog.products.map((item) => [item.id, item]));
    return {
      hydrated,
      source,
      products: catalog.products,
      categories: catalog.categories,
      mukhiFilters: getMukhiFilters(catalog.products),
      getProductById: (id) => byId.get(id),
      getCategoryById: (id) => findCategory(catalog, id),
      getProductsByCategory: (categoryId) => productsInCategory(catalog, categoryId),
      getProductsByMukhi: (mukhi) => catalog.products.filter((item) => item.mukhi === mukhi),
      getFeaturedProducts: () => catalog.products.filter((item) => item.featured),
      refresh,
    };
  }, [catalog, hydrated, source, refresh]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return value;
}
