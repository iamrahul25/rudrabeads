import type { ApiAnalytics } from '../../src/shared/api';
import { toIso } from './util';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Orders are bucketed by Indian calendar day / month. */
const IST = `'+330 minutes'`;

type Row = Record<string, unknown>;
const num = (value: unknown) => (typeof value === 'number' ? value : 0);

/** `days` = 0 means all time. */
export async function getAnalytics(db: D1Database, days: number): Promise<ApiAnalytics> {
  const since = days > 0 ? Date.now() - days * DAY_MS : 0;
  const bucket = days > 0 && days <= 90 ? 'day' : 'month';
  const bucketSql =
    bucket === 'day'
      ? `date(o.created_at / 1000, 'unixepoch', ${IST})`
      : `strftime('%Y-%m', o.created_at / 1000, 'unixepoch', ${IST})`;

  const results = await db.batch<Row>([
    db
      .prepare(
        `SELECT COUNT(*) AS orders,
           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
           SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) AS order_value,
           SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) AS collected,
           COUNT(DISTINCT phone) AS customers
         FROM orders WHERE created_at >= ?`,
      )
      .bind(since),
    db
      .prepare(
        `SELECT COALESCE(SUM(i.qty), 0) AS units FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE o.created_at >= ? AND o.status != 'cancelled'`,
      )
      .bind(since),
    db.prepare('SELECT status, COUNT(*) AS n FROM orders WHERE created_at >= ? GROUP BY status').bind(since),
    db
      .prepare('SELECT payment_status, COUNT(*) AS n FROM orders WHERE created_at >= ? GROUP BY payment_status')
      .bind(since),
    db
      .prepare(
        `SELECT ${bucketSql} AS bucket, COUNT(*) AS orders,
           SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END) AS order_value
         FROM orders o WHERE o.created_at >= ? GROUP BY bucket ORDER BY bucket`,
      )
      .bind(since),
    db
      .prepare(
        `SELECT i.product_id, MAX(i.name) AS name, SUM(i.qty) AS units, SUM(i.qty * i.price) AS revenue,
           COUNT(DISTINCT i.order_id) AS orders
         FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE o.created_at >= ? AND o.status != 'cancelled'
         GROUP BY i.product_id ORDER BY revenue DESC LIMIT 10`,
      )
      .bind(since),
    db
      .prepare(
        `SELECT c.id AS category_id, COALESCE(c.name, 'Deleted products') AS name,
           SUM(i.qty) AS units, SUM(i.qty * i.price) AS revenue
         FROM order_items i JOIN orders o ON o.id = i.order_id
         LEFT JOIN products p ON p.id = i.product_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE o.created_at >= ? AND o.status != 'cancelled'
         GROUP BY c.id ORDER BY revenue DESC`,
      )
      .bind(since),
    db.prepare(
      `SELECT
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN payment_status = 'pending' AND status != 'cancelled' THEN 1 ELSE 0 END) AS payment_pending
       FROM orders`,
    ),
    db.prepare(
      `SELECT COUNT(*) AS products,
         SUM(CASE WHEN in_stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
         SUM(CASE WHEN price IS NULL THEN 1 ELSE 0 END) AS price_on_request,
         (SELECT COUNT(*) FROM categories) AS categories
       FROM products`,
    ),
  ]);

  const [totals, units, status, payment, series, top, categories, attention, catalog] = results.map((r) => r.results);
  const t = totals[0] ?? {};
  const live = num(t.orders) - num(t.cancelled);

  return {
    rangeDays: days,
    bucket,
    since: since ? toIso(since) : null,
    totals: {
      orders: num(t.orders),
      cancelled: num(t.cancelled),
      orderValue: num(t.order_value),
      collected: num(t.collected),
      averageOrderValue: live > 0 ? Math.round(num(t.order_value) / live) : 0,
      customers: num(t.customers),
      units: num(units[0]?.units),
    },
    needsAttention: { pending: num(attention[0]?.pending), paymentPending: num(attention[0]?.payment_pending) },
    byStatus: Object.fromEntries(status.map((row) => [row.status as string, num(row.n)])),
    byPayment: Object.fromEntries(payment.map((row) => [row.payment_status as string, num(row.n)])),
    series: series.map((row) => ({
      bucket: row.bucket as string,
      orders: num(row.orders),
      orderValue: num(row.order_value),
    })),
    topProducts: top.map((row) => ({
      productId: row.product_id as string,
      name: row.name as string,
      units: num(row.units),
      revenue: num(row.revenue),
      orders: num(row.orders),
    })),
    byCategory: categories.map((row) => ({
      categoryId: (row.category_id as string | null) ?? null,
      name: row.name as string,
      units: num(row.units),
      revenue: num(row.revenue),
    })),
    catalog: {
      products: num(catalog[0]?.products),
      outOfStock: num(catalog[0]?.out_of_stock),
      priceOnRequest: num(catalog[0]?.price_on_request),
      categories: num(catalog[0]?.categories),
    },
  };
}
