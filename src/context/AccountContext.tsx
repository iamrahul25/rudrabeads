import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { usePersistentState } from '@/hooks/usePersistentState';
import {
  createOrderId,
  emptyAddress,
  type Address,
  type Order,
  type OrderLine,
} from '@/lib/orders';

export type Profile = { name: string; phone: string; email: string };

const emptyProfile: Profile = { name: '', phone: '', email: '' };

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
  return stored.filter(
    (order): order is Order =>
      !!order &&
      typeof order.id === 'string' &&
      Array.isArray(order.lines) &&
      typeof order.total === 'number' &&
      !!order.address,
  );
}

export type PlaceOrderInput = {
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  address: Address;
};

type AccountContextValue = {
  hydrated: boolean;
  profile: Profile;
  address: Address | null;
  orders: Order[];
  updateProfile: (profile: Profile) => void;
  saveAddress: (address: Address) => void;
  placeOrder: (input: PlaceOrderInput) => Order;
  cancelOrder: (id: string) => void;
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

  const updateProfile = useCallback((next: Profile) => setProfile(next), [setProfile]);
  const saveAddress = useCallback((next: Address) => setAddress(next), [setAddress]);

  const placeOrder = useCallback(
    (input: PlaceOrderInput) => {
      const order: Order = {
        ...input,
        id: createOrderId(),
        createdAt: new Date().toISOString(),
        status: 'payment_pending',
      };
      setOrders((prev) => [order, ...prev]);
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
    (id: string) => {
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status: 'cancelled' } : order)),
      );
    },
    [setOrders],
  );

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
      getOrder,
      signOut,
    }),
    [hydrated, profile, address, orders, updateProfile, saveAddress, placeOrder, cancelOrder, getOrder, signOut],
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
