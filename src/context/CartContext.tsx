import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { getProductById, type Product } from '@/data/products';
import { usePersistentState } from '@/hooks/usePersistentState';
import { addToLines, lineSubtotal, setLineQty, type CartLine } from '@/lib/cart';
import { couponsEnabled, evaluateCoupon, findCoupon, type CouponResult } from '@/lib/coupons';

export type { CartLine };

export type CartItem = Product & { qty: number };

type StoredCart = { lines: CartLine[]; couponCode: string | null };

const emptyCart: StoredCart = { lines: [], couponCode: null };

function sanitizeCart(stored: unknown): StoredCart {
  if (!stored || typeof stored !== 'object') return emptyCart;
  const raw = stored as Partial<StoredCart>;
  const lines = Array.isArray(raw.lines)
    ? raw.lines.filter(
        (line): line is CartLine =>
          !!line &&
          typeof line.id === 'string' &&
          typeof line.qty === 'number' &&
          line.qty > 0 &&
          getProductById(line.id) != null,
      )
    : [];
  const couponCode = typeof raw.couponCode === 'string' && findCoupon(raw.couponCode) ? raw.couponCode : null;
  return { lines, couponCode };
}

type CartContextValue = {
  hydrated: boolean;
  lines: CartLine[];
  items: CartItem[];
  /** Total units across all lines. */
  count: number;
  /** Number of distinct products. */
  lineCount: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  coupon: CouponResult | null;
  getQty: (id: string) => number;
  addItem: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  applyCoupon: (code: string) => CouponResult;
  removeCoupon: () => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart, hydrated] = usePersistentState<StoredCart>('cart', emptyCart, sanitizeCart);
  const { lines } = cart;
  const couponCode = couponsEnabled ? cart.couponCode : null;

  const addItem = useCallback(
    (id: string, qty = 1) => {
      const product = getProductById(id);
      if (!product) return;
      setCart((prev) => ({ ...prev, lines: addToLines(prev.lines, product, qty) }));
    },
    [setCart],
  );

  const setQty = useCallback(
    (id: string, qty: number) => {
      const product = getProductById(id);
      if (!product) return;
      setCart((prev) => ({ ...prev, lines: setLineQty(prev.lines, product, qty) }));
    },
    [setCart],
  );

  const removeItem = useCallback(
    (id: string) => {
      setCart((prev) => ({ ...prev, lines: prev.lines.filter((line) => line.id !== id) }));
    },
    [setCart],
  );

  const items = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = getProductById(line.id);
        return product ? [{ ...product, qty: line.qty }] : [];
      }),
    [lines],
  );

  const subtotal = useMemo(() => lineSubtotal(items), [items]);
  const coupon = useMemo(
    () => (couponCode ? evaluateCoupon(couponCode, subtotal) : null),
    [couponCode, subtotal],
  );
  const discount = coupon?.ok ? coupon.discount : 0;

  const applyCoupon = useCallback(
    (code: string): CouponResult => {
      if (!couponsEnabled) {
        return { ok: false, coupon: null, message: 'Coupons are coming soon.' };
      }
      const result = evaluateCoupon(code, subtotal);
      if (result.coupon) {
        setCart((prev) => ({ ...prev, couponCode: result.coupon!.code }));
      }
      return result;
    },
    [setCart, subtotal],
  );

  const removeCoupon = useCallback(() => {
    setCart((prev) => ({ ...prev, couponCode: null }));
  }, [setCart]);

  const clear = useCallback(() => setCart(emptyCart), [setCart]);

  const getQty = useCallback(
    (id: string) => lines.find((line) => line.id === id)?.qty ?? 0,
    [lines],
  );

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);

  const value = useMemo(
    () => ({
      hydrated,
      lines,
      items,
      count,
      lineCount: lines.length,
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      couponCode,
      coupon,
      getQty,
      addItem,
      setQty,
      removeItem,
      applyCoupon,
      removeCoupon,
      clear,
    }),
    [
      hydrated,
      lines,
      items,
      count,
      subtotal,
      discount,
      couponCode,
      coupon,
      getQty,
      addItem,
      setQty,
      removeItem,
      applyCoupon,
      removeCoupon,
      clear,
    ],
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
