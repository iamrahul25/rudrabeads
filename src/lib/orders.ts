import type { ApiOrder } from '@/shared/api';
import {
  isOrderStatus,
  isPaymentStatus,
  type Address,
  type OrderStatus,
  type PaymentStatus,
} from '@/shared/orders';

export {
  CUSTOMER_CANCELLABLE,
  cleanAddress,
  emptyAddress,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  orderStatusLabel,
  paymentStatusLabel,
  validateAddress,
} from '@/shared/orders';
export type { Address, AddressErrors, OrderStatus, PaymentStatus } from '@/shared/orders';

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

export type OrderEvent = {
  at: string;
  status: OrderStatus | null;
  paymentStatus: PaymentStatus | null;
  note: string;
  actor: string;
};

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  address: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  courier: string;
  trackingNumber: string;
  events: OrderEvent[];
  /** Lets this device view and cancel the order on the server. Null for orders saved before the store went online. */
  token: string | null;
};

export function orderFromApi(api: ApiOrder, token: string | null): Order {
  return {
    id: api.id,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    lines: api.lines.map(({ productId, name, price, priceUnit, qty }) => ({ productId, name, price, priceUnit, qty })),
    subtotal: api.subtotal,
    discount: api.discount,
    total: api.total,
    couponCode: api.couponCode,
    address: api.address,
    status: api.status,
    paymentStatus: api.paymentStatus,
    courier: api.courier,
    trackingNumber: api.trackingNumber,
    events: api.events.map(({ at, status, paymentStatus, note, actor }) => ({ at, status, paymentStatus, note, actor })),
    token,
  };
}

/** Accepts orders saved by any app version, including the old local-only `payment_pending` ones. */
export function normalizeStoredOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== 'object') return null;
  const order = raw as Record<string, unknown>;
  if (typeof order.id !== 'string' || !Array.isArray(order.lines) || typeof order.total !== 'number' || !order.address) {
    return null;
  }
  const createdAt = typeof order.createdAt === 'string' ? order.createdAt : new Date(0).toISOString();
  const status: OrderStatus = isOrderStatus(order.status) ? order.status : order.status === 'cancelled' ? 'cancelled' : 'pending';
  return {
    id: order.id,
    createdAt,
    updatedAt: typeof order.updatedAt === 'string' ? order.updatedAt : createdAt,
    lines: order.lines as OrderLine[],
    subtotal: typeof order.subtotal === 'number' ? order.subtotal : order.total,
    discount: typeof order.discount === 'number' ? order.discount : 0,
    total: order.total,
    couponCode: typeof order.couponCode === 'string' ? order.couponCode : null,
    address: order.address as Address,
    status,
    paymentStatus: isPaymentStatus(order.paymentStatus) ? order.paymentStatus : 'pending',
    courier: typeof order.courier === 'string' ? order.courier : '',
    trackingNumber: typeof order.trackingNumber === 'string' ? order.trackingNumber : '',
    events: Array.isArray(order.events) ? (order.events as OrderEvent[]) : [],
    token: typeof order.token === 'string' ? order.token : null,
  };
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatOrderDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
