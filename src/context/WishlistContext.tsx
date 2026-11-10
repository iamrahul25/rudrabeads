import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { getProductById, type Product } from '@/data/products';
import { usePersistentState } from '@/hooks/usePersistentState';

function sanitizeIds(stored: unknown): string[] {
  if (!Array.isArray(stored)) return [];
  return [...new Set(stored.filter((id): id is string => typeof id === 'string' && !!getProductById(id)))];
}

type WishlistContextValue = {
  hydrated: boolean;
  ids: string[];
  items: Product[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds, hydrated] = usePersistentState<string[]>('wishlist', [], sanitizeIds);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]));
    },
    [setIds],
  );

  const remove = useCallback(
    (id: string) => setIds((prev) => prev.filter((item) => item !== id)),
    [setIds],
  );

  const clear = useCallback(() => setIds([]), [setIds]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const items = useMemo(
    () => ids.map((id) => getProductById(id)).filter((item): item is Product => item != null),
    [ids],
  );

  const value = useMemo(
    () => ({ hydrated, ids, items, count: items.length, has, toggle, remove, clear }),
    [hydrated, ids, items, has, toggle, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return value;
}
