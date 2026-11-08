import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getProductById, type Product } from '@/data/products';

export type CartLine = {
  id: string;
  qty: number;
};

export type CartItem = Product & { qty: number };

type CartContextValue = {
  lines: CartLine[];
  items: CartItem[];
  count: number;
  addItem: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((id: string, qty = 1) => {
    const amount = Math.max(1, Math.floor(qty));
    setLines((prev) => {
      const existing = prev.find((line) => line.id === id);
      if (!existing) return [...prev, { id, qty: amount }];
      return prev.map((line) =>
        line.id === id ? { ...line, qty: line.qty + amount } : line,
      );
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const amount = Math.floor(qty);
    setLines((prev) => {
      if (amount <= 0) return prev.filter((line) => line.id !== id);
      return prev.map((line) => (line.id === id ? { ...line, qty: amount } : line));
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const items = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = getProductById(line.id);
        return product ? [{ ...product, qty: line.qty }] : [];
      }),
    [lines],
  );

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);

  const value = useMemo(
    () => ({ lines, items, count, addItem, setQty, removeItem }),
    [lines, items, count, addItem, setQty, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used within CartProvider');
  }
  return value;
}
