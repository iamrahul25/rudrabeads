import type { ApiCatalog, ApiOrder } from '@/shared/api';
import type { Address } from '@/shared/orders';

/** Base URL of the Cloudflare Worker, e.g. https://rudrabeads-api.<account>.workers.dev */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

export const isApiConfigured = API_URL.length > 0;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Sent as-is (for image uploads) instead of JSON. */
  raw?: Blob;
  token?: string | null;
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError('The store server is not set up yet (EXPO_PUBLIC_API_URL is missing).', 0, 'not_configured');
  }
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let body: Blob | string | undefined;
  if (options.raw) {
    body = options.raw;
    headers['Content-Type'] = options.raw.type || 'application/octet-stream';
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20000);
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: options.method ?? (body !== undefined ? 'POST' : 'GET'),
      headers,
      body,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('Could not reach the store. Check your internet connection and try again.', 0, 'network');
  } finally {
    clearTimeout(timer);
  }

  const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed (${res.status}).`, res.status, data?.code);
  }
  return data as T;
}

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';

export const fetchCatalog = () => apiRequest<ApiCatalog>('/api/catalog');

export type NewOrderInput = {
  lines: { productId: string; qty: number }[];
  address: Address;
  expectedTotal: number;
};

export const submitOrder = (input: NewOrderInput) =>
  apiRequest<{ order: ApiOrder; token: string }>('/api/orders', { body: input });

export const lookupOrders = (orders: { id: string; token: string }[]) =>
  apiRequest<{ orders: ApiOrder[] }>('/api/orders/lookup', { body: { orders } });

export const cancelOrderRequest = (id: string, token: string) =>
  apiRequest<{ order: ApiOrder }>(`/api/orders/${encodeURIComponent(id)}/cancel`, { body: { token } });
