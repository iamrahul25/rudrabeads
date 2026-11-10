/**
 * Order rules used by both the app and the API worker (worker/src imports this file),
 * so it must stay free of React Native and Worker-only APIs.
 */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  refunded: 'Refunded',
};

/** Customers can cancel on their own until the order is packed. */
export const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = ['pending', 'confirmed'];

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);

export const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  typeof value === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(value);

export const MAX_LINE_QTY = 9999;
export const MAX_ORDER_LINES = 50;

export function minOrderQty(product: { minOrderQty: number | null }) {
  return Math.max(1, product.minOrderQty ?? 1);
}

export type Address = {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

export const emptyAddress: Address = {
  fullName: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

export type AddressErrors = Partial<Record<keyof Address, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepts 10-digit Indian mobiles with optional +91 / 0 prefix and separators. */
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidPhone(value: string) {
  return /^[6-9]\d{9}$/.test(normalizePhone(value));
}

export function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

const ADDRESS_MAX_LENGTH: Record<keyof Address, number> = {
  fullName: 80,
  phone: 20,
  email: 120,
  line1: 200,
  line2: 200,
  city: 80,
  state: 80,
  pincode: 6,
};

export function validateAddress(address: Address): AddressErrors {
  const errors: AddressErrors = {};
  if (address.fullName.trim().length < 2) errors.fullName = 'Enter the full name.';
  if (!isValidPhone(address.phone)) errors.phone = 'Enter a valid 10-digit mobile number.';
  if (address.email.trim() && !isValidEmail(address.email)) errors.email = 'Enter a valid email.';
  if (address.line1.trim().length < 5) errors.line1 = 'Enter house no. and street.';
  if (address.city.trim().length < 2) errors.city = 'Enter the city.';
  if (address.state.trim().length < 2) errors.state = 'Enter the state.';
  if (!/^[1-9]\d{5}$/.test(address.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.';
  for (const key of Object.keys(ADDRESS_MAX_LENGTH) as (keyof Address)[]) {
    if (!errors[key] && address[key].trim().length > ADDRESS_MAX_LENGTH[key]) {
      errors[key] = `Keep this under ${ADDRESS_MAX_LENGTH[key]} characters.`;
    }
  }
  return errors;
}

/** Trimmed copy with the phone reduced to 10 digits. */
export function cleanAddress(address: Address): Address {
  return {
    fullName: address.fullName.trim(),
    phone: normalizePhone(address.phone),
    email: address.email.trim(),
    line1: address.line1.trim(),
    line2: address.line2.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
  };
}
