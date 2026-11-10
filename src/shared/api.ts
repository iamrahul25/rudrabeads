/** JSON shapes returned by the API worker. Shared with worker/src, so keep this type-only. */
import type { Address, OrderStatus, PaymentStatus } from './orders';

export type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category: string;
  price: number | null;
  priceUnit: string | null;
  minOrderQty: number | null;
  minOrderUnit: string | null;
  mukhi: number | null;
  origin: string | null;
  beadSize: string | null;
  certification: string | null;
  labName: string | null;
  treatment: string | null;
  rulingDeity: string | null;
  rulingPlanet: string | null;
  usage: string | null;
  shape: string | null;
  color: string | null;
  material: string | null;
  specs: Record<string, string>;
  description: string;
  /** Image URLs; the first is the cover. */
  images: string[];
  imageKeys: string[];
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiCategory = {
  id: string;
  name: string;
  intro: string;
  /** Category image, or the first product's cover when the category has none. */
  image: string | null;
  /** The category's own image key (null when it falls back to a product image). */
  imageKey: string | null;
  productIds: string[];
  count: number;
  sortOrder: number;
};

export type ApiCatalog = { categories: ApiCategory[]; products: ApiProduct[]; generatedAt: string };

export type ApiOrderLine = {
  productId: string;
  name: string;
  sku: string;
  price: number;
  priceUnit: string | null;
  qty: number;
};

export type ApiOrderEvent = {
  at: string;
  status: OrderStatus | null;
  paymentStatus: PaymentStatus | null;
  note: string;
  /** 'customer', 'store', or the admin's email in admin responses. */
  actor: string;
};

export type ApiOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  address: Address;
  lines: ApiOrderLine[];
  courier: string;
  trackingNumber: string;
  events: ApiOrderEvent[];
  /** Admin responses only. */
  adminNote?: string;
};

export type ApiOrderSummary = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  customerName: string;
  phone: string;
  city: string;
  state: string;
  lineCount: number;
  units: number;
  itemNames: string;
};

export type ApiOrderList = {
  orders: ApiOrderSummary[];
  total: number;
  statusCounts: Partial<Record<OrderStatus, number>>;
};

export type ApiAnalytics = {
  rangeDays: number;
  bucket: 'day' | 'month';
  since: string | null;
  totals: {
    orders: number;
    cancelled: number;
    /** Value of all non-cancelled orders. */
    orderValue: number;
    /** Value of orders marked paid. */
    collected: number;
    averageOrderValue: number;
    customers: number;
    units: number;
  };
  needsAttention: { pending: number; paymentPending: number };
  byStatus: Partial<Record<OrderStatus, number>>;
  byPayment: Partial<Record<PaymentStatus, number>>;
  series: { bucket: string; orders: number; orderValue: number }[];
  topProducts: { productId: string; name: string; units: number; revenue: number; orders: number }[];
  byCategory: { categoryId: string | null; name: string; units: number; revenue: number }[];
  catalog: { products: number; outOfStock: number; priceOnRequest: number; categories: number };
};

export type ApiAdmin = { email: string; name: string; picture: string };

export type ApiAdminSession = { token: string; admin: ApiAdmin; expiresAt: number };

/** Body for creating or updating a product. Empty optional fields are sent as null. */
export type ApiProductInput = {
  name: string;
  categoryId: string;
  sku: string | null;
  price: number | null;
  priceUnit: string | null;
  minOrderQty: number | null;
  minOrderUnit: string | null;
  mukhi: number | null;
  origin: string | null;
  beadSize: string | null;
  certification: string | null;
  labName: string | null;
  treatment: string | null;
  rulingDeity: string | null;
  rulingPlanet: string | null;
  usage: string | null;
  shape: string | null;
  color: string | null;
  material: string | null;
  specs: Record<string, string>;
  description: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
};

export type ApiCategoryInput = { name: string; intro: string; imageKey: string | null };

export type ApiOrderPatch = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  courier?: string;
  trackingNumber?: string;
  adminNote?: string;
};
