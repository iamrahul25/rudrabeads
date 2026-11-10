import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { usePersistentState } from '@/hooks/usePersistentState';
import { cancelOrderRequest, isApiConfigured, lookupOrders, submitOrder, type NewOrderInput } from '@/lib/api';
import {
  emptyAddress,
  normalizeStoredOrder,
  orderFromApi,
  type Address,
  type Order,
} from '@/lib/orders';

export type Profile = { name: string; phone: string; email: string };

const emptyProfile: Profile = { name: '', phone: '', email: '' };

/** Orders refreshed per lookup; older ones keep their last known status. */
const MAX_SYNCED_ORDERS = 50;

function pickStrings<T extends Record<string, string>>(template: T, raw: unknown): T {
  if (!raw || typeof raw !== 'object') return template;
  const source = raw as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(template).map((key) => [key, typeof source[key] === 'string' ? source[key] : '']),
  ) as T;
}

const sanitizeProfile = (stored: unknown) => pickStrings(emptyProfile, stored);

function sanitizeAddress(stored: unknown): Address | null {
  if (!stored || typeof stored !== 'object') return null;
  return pickStrings(emptyAddress, stored);
}

function sanitizeOrders(stored: unknown): Order[] {
  if (!Array.isArray(stored)) return [];
  return stored.map(normalizeStoredOrder).filter((order): order is Order => order != null);
}

export type PlaceOrderInput = NewOrderInput;

type AccountContextValue = {
  hydrated: boolean;
  profile: Profile;
  address: Address | null;
  orders: Order[];
  updateProfile: (profile: Profile) => void;
  saveAddress: (address: Address) => void;
  /** Sends the order to the store. Throws an ApiError when it can't be placed. */
  placeOrder: (input: PlaceOrderInput) => Promise<Order>;
  /** Throws an ApiError when the store refuses (e.g. the order is already packed). */
  cancelOrder: (id: string) => Promise<void>;
  /** Pulls the latest status of this device's orders. Resolves to false when offline. */
  refreshOrders: () => Promise<boolean>;
  getOrder: (id: string) => Order | undefined;
  signOut: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile, profileReady] = usePersistentState('profile', emptyProfile, sanitizeProfile);
  const [address, setAddress, addressReady] = usePersistentState<Address | null>(
    'address',
    null,
    sanitizeAddress,
  );
  const [orders, setOrders, ordersReady] = usePersistentState<Order[]>('orders', [], sanitizeOrders);
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const updateProfile = useCallback((next: Profile) => setProfile(next), [setProfile]);
  const saveAddress = useCallback((next: Address) => setAddress(next), [setAddress]);

  const mergeOrder = useCallback(
    (next: Order) => {
      setOrders((prev) => prev.map((order) => (order.id === next.id ? { ...next, token: order.token ?? next.token } : order)));
    },
    [setOrders],
  );

  const placeOrder = useCallback(
    async (input: PlaceOrderInput) => {
      const { order: created, token } = await submitOrder(input);
      const order = orderFromApi(created, token);
      setOrders((prev) => [order, ...prev.filter((item) => item.id !== order.id)]);
      setAddress(input.address);
      setProfile((prev) => ({
        name: prev.name || input.address.fullName,
        phone: prev.phone || input.address.phone,
        email: prev.email || input.address.email,
      }));
      return order;
    },
    [setAddress, setOrders, setProfile],
  );

  const cancelOrder = useCallback(
    async (id: string) => {
      const order = ordersRef.current.find((item) => item.id === id);
      if (!order) return;
      if (!order.token) {
        mergeOrder({ ...order, status: 'cancelled', updatedAt: new Date().toISOString() });
        return;
      }
      const { order: updated } = await cancelOrderRequest(id, order.token);
      mergeOrder(orderFromApi(updated, order.token));
    },
    [mergeOrder],
  );

  const syncingRef = useRef<Promise<boolean> | null>(null);

  const refreshOrders = useCallback(() => {
    if (syncingRef.current) return syncingRef.current;
    const refs = ordersRef.current
      .filter((order): order is Order & { token: string } => !!order.token)
      .slice(0, MAX_SYNCED_ORDERS)
      .map((order) => ({ id: order.id, token: order.token }));
    if (!isApiConfigured || !refs.length) return Promise.resolve(true);

    const run = lookupOrders(refs)
      .then(({ orders: fresh }) => {
        const byId = new Map(fresh.map((order) => [order.id, order]));
        setOrders((prev) =>
          prev.map((order) => {
            const latest = byId.get(order.id);
            return latest && order.token ? orderFromApi(latest, order.token) : order;
          }),
        );
        return true;
      })
      .catch(() => false)
      .finally(() => {
        syncingRef.current = null;
      });
    syncingRef.current = run;
    return run;
  }, [setOrders]);

  const getOrder = useCallback((id: string) => orders.find((order) => order.id === id), [orders]);

  const signOut = useCallback(() => {
    setProfile(emptyProfile);
    setAddress(null);
    setOrders([]);
  }, [setAddress, setOrders, setProfile]);

  const hydrated = profileReady && addressReady && ordersReady;

  const value = useMemo(
    () => ({
      hydrated,
      profile,
      address,
      orders,
      updateProfile,
      saveAddress,
      placeOrder,
      cancelOrder,
      refreshOrders,
      getOrder,
      signOut,
    }),
    [
      hydrated,
      profile,
      address,
      orders,
      updateProfile,
      saveAddress,
      placeOrder,
      cancelOrder,
      refreshOrders,
      getOrder,
      signOut,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return value;
}
