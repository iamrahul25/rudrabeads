import { apiRequest } from '@/lib/api';
import type {
  ApiAdmin,
  ApiAdminSession,
  ApiAnalytics,
  ApiCatalog,
  ApiCategoryInput,
  ApiOrder,
  ApiOrderList,
  ApiOrderPatch,
  ApiProduct,
  ApiProductInput,
} from '@/shared/api';
import type { OrderStatus, PaymentStatus } from '@/shared/orders';

export const signInWithGoogle = (credential: string) =>
  apiRequest<ApiAdminSession>('/api/auth/google', { body: { credential } });

export const fetchMe = (token: string) => apiRequest<{ admin: ApiAdmin }>('/api/admin/me', { token });

export const fetchAdminCatalog = (token: string) => apiRequest<ApiCatalog>('/api/admin/catalog', { token });

export const fetchProduct = (token: string, id: string) =>
  apiRequest<{ product: ApiProduct }>(`/api/admin/products/${encodeURIComponent(id)}`, { token });

/** Creates when `id` is null, otherwise replaces the product. */
export const saveProduct = (token: string, id: string | null, input: ApiProductInput) =>
  apiRequest<{ product: ApiProduct }>(id ? `/api/admin/products/${encodeURIComponent(id)}` : '/api/admin/products', {
    token,
    method: id ? 'PUT' : 'POST',
    body: input,
  });

export const deleteProduct = (token: string, id: string) =>
  apiRequest<{ ok: true }>(`/api/admin/products/${encodeURIComponent(id)}`, { token, method: 'DELETE' });

export const uploadImage = (token: string, image: Blob) =>
  apiRequest<{ key: string; url: string }>('/api/admin/images', { token, raw: image, timeoutMs: 60000 });

/** Removes an upload that never got saved. The server keeps it if something uses it. */
export const discardImage = (token: string, key: string) =>
  apiRequest<{ ok: true }>(`/api/admin/images/${encodeURIComponent(key)}`, { token, method: 'DELETE' });

export const saveCategory = (token: string, id: string | null, input: ApiCategoryInput) =>
  apiRequest<{ ok: true; id?: string }>(
    id ? `/api/admin/categories/${encodeURIComponent(id)}` : '/api/admin/categories',
    { token, method: id ? 'PUT' : 'POST', body: input },
  );

export const deleteCategory = (token: string, id: string) =>
  apiRequest<{ ok: true }>(`/api/admin/categories/${encodeURIComponent(id)}`, { token, method: 'DELETE' });

export const reorderCategories = (token: string, ids: string[]) =>
  apiRequest<{ ok: true }>('/api/admin/categories/reorder', { token, body: { ids } });

export type OrderQuery = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  limit?: number;
  offset?: number;
};

export function fetchOrders(token: string, query: OrderQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return apiRequest<ApiOrderList>(`/api/admin/orders?${params.toString()}`, { token });
}

export const fetchOrder = (token: string, id: string) =>
  apiRequest<{ order: ApiOrder }>(`/api/admin/orders/${encodeURIComponent(id)}`, { token });

export const updateOrder = (token: string, id: string, patch: ApiOrderPatch) =>
  apiRequest<{ order: ApiOrder }>(`/api/admin/orders/${encodeURIComponent(id)}`, {
    token,
    method: 'PATCH',
    body: patch,
  });

export const deleteOrder = (token: string, id: string) =>
  apiRequest<{ ok: true }>(`/api/admin/orders/${encodeURIComponent(id)}`, { token, method: 'DELETE' });

export const fetchAnalytics = (token: string, days: number) =>
  apiRequest<ApiAnalytics>(`/api/admin/analytics?days=${days}`, { token });
