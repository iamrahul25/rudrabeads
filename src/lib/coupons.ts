import { formatINR } from '@/data/products';

/** Coupons and offers are hidden behind "Coming soon" until this is turned on. */
export const couponsEnabled = false;

export type Coupon = {
  code: string;
  title: string;
  percentOff: number;
  minSubtotal: number;
  maxDiscount: number;
};

export const coupons: Coupon[] = [
  {
    code: 'WELCOME10',
    title: '10% off your order',
    percentOff: 10,
    minSubtotal: 500,
    maxDiscount: 500,
  },
  {
    code: 'RUDRA5',
    title: '5% off orders above ₹5,000',
    percentOff: 5,
    minSubtotal: 5000,
    maxDiscount: 2500,
  },
];

export function describeCoupon(coupon: Coupon) {
  return `${coupon.percentOff}% off on orders of ${formatINR(coupon.minSubtotal)} or more (up to ${formatINR(coupon.maxDiscount)})`;
}

export function findCoupon(code: string) {
  const normalized = code.trim().toUpperCase();
  return coupons.find((coupon) => coupon.code === normalized);
}

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; coupon: Coupon | null; message: string };

export function evaluateCoupon(code: string, subtotal: number): CouponResult {
  if (!code.trim()) return { ok: false, coupon: null, message: 'Enter a coupon code.' };
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, coupon: null, message: 'This coupon code is not valid.' };
  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      coupon,
      message: `Add ${formatINR(coupon.minSubtotal - subtotal)} more to use ${coupon.code}.`,
    };
  }
  const discount = Math.min(
    coupon.maxDiscount,
    Math.round((subtotal * coupon.percentOff) / 100),
  );
  return { ok: true, coupon, discount };
}
