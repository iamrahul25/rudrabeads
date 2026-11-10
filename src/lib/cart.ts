import type { Product } from '@/data/products';
import { MAX_LINE_QTY, minOrderQty } from '@/shared/orders';

export { MAX_LINE_QTY, minOrderQty };

type QtyRules = Pick<Product, 'minOrderQty'>;

export function clampQty(product: QtyRules, qty: number) {
  return Math.min(MAX_LINE_QTY, Math.max(minOrderQty(product), Math.floor(qty)));
}

export function isPurchasable(product: Pick<Product, 'price' | 'inStock'>) {
  return product.price != null && product.inStock;
}

export type CartLine = { id: string; qty: number };

/** Adding a new line starts at the product's minimum order quantity. */
export function addToLines(lines: CartLine[], product: Product, qty = 1): CartLine[] {
  if (!isPurchasable(product)) return lines;
  const existing = lines.find((line) => line.id === product.id);
  if (!existing) return [...lines, { id: product.id, qty: clampQty(product, qty) }];
  return lines.map((line) =>
    line.id === product.id ? { ...line, qty: clampQty(product, line.qty + Math.floor(qty)) } : line,
  );
}

/** Going below the minimum order quantity removes the line. */
export function setLineQty(lines: CartLine[], product: Product, qty: number): CartLine[] {
  if (Math.floor(qty) < minOrderQty(product)) {
    return lines.filter((line) => line.id !== product.id);
  }
  if (!lines.some((line) => line.id === product.id)) {
    return addToLines(lines, product, qty);
  }
  return lines.map((line) =>
    line.id === product.id ? { ...line, qty: clampQty(product, qty) } : line,
  );
}

export function lineSubtotal(items: { price: number | null; qty: number }[]) {
  return items.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0);
}
