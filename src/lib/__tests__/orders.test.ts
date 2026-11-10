import {
  emptyAddress,
  isValidPhone,
  normalizeStoredOrder,
  validateAddress,
  type Address,
} from '@/lib/orders';

const valid: Address = {
  ...emptyAddress,
  fullName: 'Asha Verma',
  phone: '+91 98765 43210',
  line1: 'B-139, Shalimar Garden Main',
  city: 'Ghaziabad',
  state: 'Uttar Pradesh',
  pincode: '201005',
};

describe('address validation', () => {
  it('accepts a complete address', () => {
    expect(validateAddress(valid)).toEqual({});
  });

  it('flags every missing required field', () => {
    expect(Object.keys(validateAddress(emptyAddress)).sort()).toEqual(
      ['city', 'fullName', 'line1', 'phone', 'pincode', 'state'].sort(),
    );
  });

  it('validates Indian mobile numbers', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('09876543210')).toBe(true);
    expect(isValidPhone('+919876543210')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('1234567890')).toBe(false);
  });

  it('validates optional email and pincode', () => {
    expect(validateAddress({ ...valid, email: 'nope' }).email).toBeDefined();
    expect(validateAddress({ ...valid, email: 'a@b.in' }).email).toBeUndefined();
    expect(validateAddress({ ...valid, pincode: '012345' }).pincode).toBeDefined();
  });
});

describe('stored orders', () => {
  const legacy = {
    id: 'RBLOCAL1',
    createdAt: '2026-01-02T03:04:05.000Z',
    lines: [{ productId: 'p', name: 'P', price: 50, priceUnit: null, qty: 2 }],
    subtotal: 100,
    discount: 0,
    total: 100,
    couponCode: null,
    address: valid,
    status: 'payment_pending',
  };

  it('upgrades orders saved before the store went online', () => {
    expect(normalizeStoredOrder(legacy)).toMatchObject({
      id: 'RBLOCAL1',
      status: 'pending',
      paymentStatus: 'pending',
      updatedAt: legacy.createdAt,
      events: [],
      token: null,
    });
    expect(normalizeStoredOrder({ ...legacy, status: 'cancelled' })?.status).toBe('cancelled');
  });

  it('keeps server fields and the device token', () => {
    const order = normalizeStoredOrder({ ...legacy, status: 'shipped', paymentStatus: 'paid', token: 'abc' });
    expect(order).toMatchObject({ status: 'shipped', paymentStatus: 'paid', token: 'abc' });
  });

  it('drops malformed entries', () => {
    expect(normalizeStoredOrder(null)).toBeNull();
    expect(normalizeStoredOrder({ id: 'x' })).toBeNull();
  });
});
