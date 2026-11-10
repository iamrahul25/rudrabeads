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

export function validateAddress(address: Address): AddressErrors {
  const errors: AddressErrors = {};
  if (address.fullName.trim().length < 2) errors.fullName = 'Enter the full name.';
  if (!isValidPhone(address.phone)) errors.phone = 'Enter a valid 10-digit mobile number.';
  if (address.email.trim() && !isValidEmail(address.email)) errors.email = 'Enter a valid email.';
  if (address.line1.trim().length < 5) errors.line1 = 'Enter house no. and street.';
  if (address.city.trim().length < 2) errors.city = 'Enter the city.';
  if (address.state.trim().length < 2) errors.state = 'Enter the state.';
  if (!/^[1-9]\d{5}$/.test(address.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.';
  return errors;
}

export function formatAddress(address: Address) {
  return [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} - ${address.pincode}`,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}

export type OrderLine = {
  productId: string;
  name: string;
  price: number;
  priceUnit: string | null;
  qty: number;
};

export type OrderStatus = 'payment_pending' | 'cancelled';

export const orderStatusLabel: Record<OrderStatus, string> = {
  payment_pending: 'Payment pending',
  cancelled: 'Cancelled',
};

export type Order = {
  id: string;
  createdAt: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  address: Address;
  status: OrderStatus;
};

export function createOrderId(now = Date.now()) {
  const random = Math.floor(Math.random() * 46656)
    .toString(36)
    .padStart(3, '0');
  return `RB${now.toString(36)}${random}`.toUpperCase();
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
