import { bundledCatalog, findProduct, type Product } from '@/data/products';
import { addToLines, lineSubtotal, MAX_LINE_QTY, setLineQty, type CartLine } from '@/lib/cart';
import { evaluateCoupon } from '@/lib/coupons';

const product = (id: string) => {
  const found = findProduct(bundledCatalog, id);
  if (!found) throw new Error(`missing fixture ${id}`);
  return found as Product;
};

const noMoq = product('5-mukhi-nepali-rudraksha');
const moq10 = product('5-mukhi-rudraksha-beads');
const onRequest = product('21-mukhi-rudraksha');

describe('cart lines', () => {
  it('adds a product and increments by one', () => {
    let lines: CartLine[] = [];
    lines = addToLines(lines, noMoq);
    expect(lines).toEqual([{ id: noMoq.id, qty: 1 }]);
    lines = addToLines(lines, noMoq);
    expect(lines).toEqual([{ id: noMoq.id, qty: 2 }]);
  });

  it('starts at the minimum order quantity', () => {
    expect(moq10.minOrderQty).toBe(10);
    const lines = addToLines([], moq10, 1);
    expect(lines).toEqual([{ id: moq10.id, qty: 10 }]);
    expect(addToLines(lines, moq10, 1)).toEqual([{ id: moq10.id, qty: 11 }]);
  });

  it('refuses products without a price', () => {
    expect(addToLines([], onRequest)).toEqual([]);
  });

  it('removes a line when quantity drops below the minimum', () => {
    const lines = addToLines([], moq10, 10);
    expect(setLineQty(lines, moq10, 9)).toEqual([]);
    expect(setLineQty(addToLines([], noMoq), noMoq, 0)).toEqual([]);
  });

  it('caps quantity', () => {
    expect(setLineQty([{ id: noMoq.id, qty: 1 }], noMoq, 1_000_000)[0].qty).toBe(MAX_LINE_QTY);
  });

  it('computes the subtotal', () => {
    expect(
      lineSubtotal([
        { price: 50, qty: 3 },
        { price: 100, qty: 10 },
      ]),
    ).toBe(1150);
  });
});

describe('coupons', () => {
  it('applies a valid coupon case-insensitively', () => {
    const result = evaluateCoupon(' welcome10 ', 1000);
    expect(result).toMatchObject({ ok: true, discount: 100 });
  });

  it('caps the discount', () => {
    expect(evaluateCoupon('WELCOME10', 100000)).toMatchObject({ ok: true, discount: 500 });
  });

  it('explains the minimum order value', () => {
    const result = evaluateCoupon('WELCOME10', 300);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe('Add ₹200 more to use WELCOME10.');
  });

  it('rejects unknown codes', () => {
    expect(evaluateCoupon('FREE100', 1000)).toMatchObject({ ok: false, coupon: null });
  });
});
