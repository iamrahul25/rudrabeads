import {
  CUSTOMER_CANCELLABLE,
  MAX_LINE_QTY,
  cleanAddress,
  minOrderQty,
  orderStatusLabel,
  paymentStatusLabel,
  validateAddress,
  type Address,
  type OrderStatus,
  type PaymentStatus,
} from '../../src/shared/orders';
import type { ApiOrder, ApiOrderList, ApiOrderSummary } from '../../src/shared/api';
import { fail } from './http';
import type { Bindings } from './types';
import { likePattern, placeholders, randomHex, sha256Hex, toIso } from './util';
import type { OrderPatchInput } from './validation';

type OrderRow = {
  id: string;
  token_hash: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  customer_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  courier: string;
  tracking_number: string;
  admin_note: string;
  created_at: number;
  updated_at: number;
};

type ItemRow = {
  order_id: string;
  position: number;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  price_unit: string | null;
  qty: number;
};

type EventRow = {
  order_id: string;
  created_at: number;
  status: OrderStatus | null;
  payment_status: PaymentStatus | null;
  note: string;
  actor: string;
};

type View = 'customer' | 'admin';

function toOrder(row: OrderRow, items: ItemRow[], events: EventRow[], view: View): ApiOrder {
  const order: ApiOrder = {
    id: row.id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    status: row.status,
    paymentStatus: row.payment_status,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    couponCode: row.coupon_code,
    address: {
      fullName: row.customer_name,
      phone: row.phone,
      email: row.email,
      line1: row.address_line1,
      line2: row.address_line2,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
    },
    lines: items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      sku: item.sku,
      price: item.price,
      priceUnit: item.price_unit,
      qty: item.qty,
    })),
    courier: row.courier,
    trackingNumber: row.tracking_number,
    events: events.map((event) => ({
      at: toIso(event.created_at),
      status: event.status,
      paymentStatus: event.payment_status,
      note: event.note,
      actor: view === 'admin' || event.actor === 'customer' ? event.actor : 'store',
    })),
  };
  if (view === 'admin') order.adminNote = row.admin_note;
  return order;
}

async function loadOrders(db: D1Database, rows: OrderRow[], view: View) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [items, events] = await db.batch<ItemRow | EventRow>([
    db.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders(ids.length)}) ORDER BY position`).bind(...ids),
    db.prepare(`SELECT * FROM order_events WHERE order_id IN (${placeholders(ids.length)}) ORDER BY created_at, id`).bind(...ids),
  ]);
  const itemRows = items.results as ItemRow[];
  const eventRows = events.results as EventRow[];
  return rows.map((row) =>
    toOrder(
      row,
      itemRows.filter((item) => item.order_id === row.id),
      eventRows.filter((event) => event.order_id === row.id),
      view,
    ),
  );
}

async function getOrderRow(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<OrderRow>();
}

export async function getOrder(db: D1Database, id: string, view: View) {
  const row = await getOrderRow(db, id);
  if (!row) return null;
  const [order] = await loadOrders(db, [row], view);
  return order;
}

/** Same shape as the app's old local ids: RB + base36 time + random. */
function createOrderId() {
  const random = [...crypto.getRandomValues(new Uint8Array(4))]
    .map((b) => (b % 36).toString(36))
    .join('');
  return `RB${Date.now().toString(36)}${random}`.toUpperCase();
}

type NewOrder = {
  lines: { productId: string; qty: number }[];
  address: Address;
  expectedTotal?: number | null;
};

type ProductForOrder = {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  price_unit: string | null;
  min_order_qty: number | null;
  in_stock: number;
};

export async function createOrder(env: Bindings, input: NewOrder) {
  const db = env.DB;
  const address = cleanAddress(input.address);
  const addressErrors = Object.values(validateAddress(address));
  if (addressErrors.length) fail(400, addressErrors[0], 'invalid_address');

  const merged = new Map<string, number>();
  for (const line of input.lines) merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.qty);
  const ids = [...merged.keys()];

  const { results } = await db
    .prepare(
      `SELECT id, sku, name, price, price_unit, min_order_qty, in_stock FROM products
       WHERE id IN (${placeholders(ids.length)})`,
    )
    .bind(...ids)
    .all<ProductForOrder>();
  const byId = new Map(results.map((product) => [product.id, product]));

  const lines = ids.map((id) => {
    const qty = merged.get(id)!;
    const product = byId.get(id);
    if (!product) {
      fail(409, 'An item in your cart is no longer available. Please remove it and try again.', 'unavailable');
    }
    if (product.price == null) {
      fail(409, `${product.name} is priced on request. Please call us to order it.`, 'unavailable');
    }
    if (!product.in_stock) fail(409, `${product.name} is out of stock right now.`, 'unavailable');
    const moq = minOrderQty({ minOrderQty: product.min_order_qty });
    if (qty < moq) fail(409, `${product.name} has a minimum order of ${moq}.`, 'quantity');
    if (qty > MAX_LINE_QTY) fail(409, `You can order at most ${MAX_LINE_QTY} of ${product.name}.`, 'quantity');
    return { product, price: product.price, qty };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discount = 0;
  const total = subtotal - discount;
  if (input.expectedTotal != null && input.expectedTotal !== total) {
    fail(
      409,
      'Some prices have changed since you opened the app. Please review your cart and place the order again.',
      'price_changed',
    );
  }

  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const now = Date.now();

  for (let attempt = 1; ; attempt++) {
    const id = createOrderId();
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO orders (id, token_hash, status, payment_status, subtotal, discount, total, coupon_code,
               customer_name, phone, email, address_line1, address_line2, city, state, pincode, created_at, updated_at)
             VALUES (?, ?, 'pending', 'pending', ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            tokenHash,
            subtotal,
            discount,
            total,
            address.fullName,
            address.phone,
            address.email,
            address.line1,
            address.line2,
            address.city,
            address.state,
            address.pincode,
            now,
            now,
          ),
        ...lines.map((line, position) =>
          db
            .prepare(
              `INSERT INTO order_items (order_id, position, product_id, name, sku, price, price_unit, qty)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(id, position, line.product.id, line.product.name, line.product.sku, line.price, line.product.price_unit, line.qty),
        ),
        db
          .prepare(
            `INSERT INTO order_events (order_id, created_at, status, payment_status, note, actor)
             VALUES (?, ?, 'pending', 'pending', 'Order placed', 'customer')`,
          )
          .bind(id, now),
      ]);
      return { order: (await getOrder(db, id, 'customer'))!, token };
    } catch (err) {
      if (attempt < 3 && /UNIQUE/i.test(String(err))) continue;
      throw err;
    }
  }
}

/** Orders whose id and token both match; anything else is silently left out. */
export async function lookupOrders(db: D1Database, refs: { id: string; token: string }[]) {
  if (!refs.length) return [];
  const hashes = new Map<string, string>();
  for (const ref of refs) hashes.set(ref.id, await sha256Hex(ref.token));
  const ids = [...hashes.keys()];
  const { results } = await db
    .prepare(`SELECT * FROM orders WHERE id IN (${placeholders(ids.length)})`)
    .bind(...ids)
    .all<OrderRow>();
  return loadOrders(
    db,
    results.filter((row) => hashes.get(row.id) === row.token_hash),
    'customer',
  );
}

export async function cancelOrderByCustomer(db: D1Database, id: string, token: string) {
  const row = await getOrderRow(db, id);
  if (!row || row.token_hash !== (await sha256Hex(token))) fail(404, 'Order not found.');
  if (row.status === 'cancelled') return (await getOrder(db, id, 'customer'))!;
  if (!CUSTOMER_CANCELLABLE.includes(row.status)) {
    fail(
      409,
      `This order is already ${orderStatusLabel[row.status].toLowerCase()} and can't be cancelled from the app. Please call us.`,
      'not_cancellable',
    );
  }
  const now = Date.now();
  const updated = await db
    .prepare(
      `UPDATE orders SET status = 'cancelled', updated_at = ?
       WHERE id = ? AND status IN (${placeholders(CUSTOMER_CANCELLABLE.length)}) RETURNING id`,
    )
    .bind(now, id, ...CUSTOMER_CANCELLABLE)
    .first();
  if (!updated) fail(409, 'This order was just updated by the store. Please refresh and try again.', 'conflict');
  await db
    .prepare(
      `INSERT INTO order_events (order_id, created_at, status, payment_status, note, actor)
       VALUES (?, ?, 'cancelled', NULL, 'Cancelled by customer', 'customer')`,
    )
    .bind(id, now)
    .run();
  return (await getOrder(db, id, 'customer'))!;
}

export type OrderListFilters = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  limit: number;
  offset: number;
};

export async function listOrders(db: D1Database, filters: OrderListFilters): Promise<ApiOrderList> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filters.status) {
    where.push('o.status = ?');
    params.push(filters.status);
  }
  if (filters.paymentStatus) {
    where.push('o.payment_status = ?');
    params.push(filters.paymentStatus);
  }
  const q = filters.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, '');
    const clauses = [`o.id LIKE ? ESCAPE '\\'`, `o.customer_name LIKE ? ESCAPE '\\'`, `o.email LIKE ? ESCAPE '\\'`];
    params.push(likePattern(q.toUpperCase()), likePattern(q), likePattern(q));
    if (digits.length >= 3) {
      clauses.push(`o.phone LIKE ? ESCAPE '\\'`);
      params.push(likePattern(digits));
    }
    where.push(`(${clauses.join(' OR ')})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows, count, statusCounts] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT o.id, o.created_at, o.status, o.payment_status, o.total, o.customer_name, o.phone, o.city, o.state,
           (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS line_count,
           (SELECT COALESCE(SUM(i.qty), 0) FROM order_items i WHERE i.order_id = o.id) AS units,
           (SELECT group_concat(i.name, ', ') FROM order_items i WHERE i.order_id = o.id) AS item_names
         FROM orders o ${whereSql}
         ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...params, filters.limit, filters.offset),
    db.prepare(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`).bind(...params),
    db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status'),
  ]);

  const orders = rows.results.map(
    (row): ApiOrderSummary => ({
      id: row.id as string,
      createdAt: toIso(row.created_at as number),
      status: row.status as OrderStatus,
      paymentStatus: row.payment_status as PaymentStatus,
      total: row.total as number,
      customerName: row.customer_name as string,
      phone: row.phone as string,
      city: row.city as string,
      state: row.state as string,
      lineCount: row.line_count as number,
      units: row.units as number,
      itemNames: (row.item_names as string | null) ?? '',
    }),
  );
  return {
    orders,
    total: (count.results[0]?.total as number) ?? 0,
    statusCounts: Object.fromEntries(statusCounts.results.map((row) => [row.status as string, row.n as number])),
  };
}

export async function updateOrder(db: D1Database, id: string, patch: OrderPatchInput, actor: string) {
  const row = await getOrderRow(db, id);
  if (!row) fail(404, 'Order not found.');

  const sets: [string, string | number][] = [];
  const notes: string[] = [];
  let newStatus: OrderStatus | null = null;
  let newPayment: PaymentStatus | null = null;

  if (patch.status && patch.status !== row.status) {
    newStatus = patch.status;
    sets.push(['status', patch.status]);
    notes.push(`Order ${orderStatusLabel[row.status]} → ${orderStatusLabel[patch.status]}`);
  }
  if (patch.paymentStatus && patch.paymentStatus !== row.payment_status) {
    newPayment = patch.paymentStatus;
    sets.push(['payment_status', patch.paymentStatus]);
    notes.push(`${paymentStatusLabel[row.payment_status]} → ${paymentStatusLabel[patch.paymentStatus]}`);
  }
  const courier = patch.courier ?? row.courier;
  const trackingNumber = patch.trackingNumber ?? row.tracking_number;
  if (courier !== row.courier || trackingNumber !== row.tracking_number) {
    sets.push(['courier', courier], ['tracking_number', trackingNumber]);
    const tracking = [courier, trackingNumber && `tracking no. ${trackingNumber}`].filter(Boolean).join(', ');
    notes.push(tracking ? `Shipping details: ${tracking}` : 'Shipping details removed');
  }
  if (patch.adminNote !== undefined && patch.adminNote !== row.admin_note) {
    sets.push(['admin_note', patch.adminNote]);
  }
  if (!sets.length) return (await getOrder(db, id, 'admin'))!;

  const now = Date.now();
  sets.push(['updated_at', now]);
  const statements = [
    db
      .prepare(`UPDATE orders SET ${sets.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?`)
      .bind(...sets.map(([, value]) => value), id),
  ];
  // Internal note edits stay out of the customer-visible history.
  if (notes.length) {
    statements.push(
      db
        .prepare(
          `INSERT INTO order_events (order_id, created_at, status, payment_status, note, actor)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, now, newStatus, newPayment, notes.join('; '), actor),
    );
  }
  await db.batch(statements);
  return (await getOrder(db, id, 'admin'))!;
}

export async function deleteOrder(db: D1Database, id: string) {
  const [, , deleted] = await db.batch([
    db.prepare('DELETE FROM order_events WHERE order_id = ?').bind(id),
    db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(id),
    db.prepare('DELETE FROM orders WHERE id = ?').bind(id),
  ]);
  if (!deleted.meta.changes) fail(404, 'Order not found.');
}
