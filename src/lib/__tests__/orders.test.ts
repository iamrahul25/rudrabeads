import { createOrderId, emptyAddress, isValidPhone, validateAddress, type Address } from '@/lib/orders';

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

describe('order ids', () => {
  it('creates unique uppercase ids', () => {
    const a = createOrderId(1);
    expect(a).toMatch(/^RB[0-9A-Z]+$/);
    const seen = new Set(Array.from({ length: 50 }, () => createOrderId()));
    expect(seen.size).toBeGreaterThan(45);
  });
});
