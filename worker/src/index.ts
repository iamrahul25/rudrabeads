import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

import { ORDER_STATUSES, PAYMENT_STATUSES } from '../../src/shared/orders';
import { getAnalytics } from './analytics';
import { requireAdmin, signInWithGoogle } from './auth';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProduct,
  listCatalog,
  reorderCategories,
  updateCategory,
  updateProduct,
} from './catalog';
import { fail, HttpError, parseWith, readJson } from './http';
import {
  deleteUnusedImages,
  IMAGE_KEY_RE,
  IMAGE_TOO_LARGE,
  imageResponse,
  imageUrl,
  isImageReferenced,
  MAX_IMAGE_BYTES,
  storeImage,
  sweepOrphanImages,
} from './images';
import {
  cancelOrderByCustomer,
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  lookupOrders,
  updateOrder,
} from './orders';
import type { AppEnv, Bindings } from './types';
import {
  categoryInput,
  googleSignInInput,
  orderCancelInput,
  orderInput,
  orderLookupInput,
  orderPatchInput,
  productInput,
  reorderInput,
} from './validation';

const app = new Hono<AppEnv>();

const originOf = (c: Context) => new URL(c.req.url).origin;

app.use('*', (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGINS ?? '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return cors({
    origin: allowed.includes('*') ? '*' : allowed,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next);
});

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message, code: err.code }, err.status);
  console.error(err);
  return c.json({ error: 'Something went wrong on the server. Please try again.' }, 500);
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.get('/', (c) => c.json({ ok: true, service: 'rudrabeads-api' }));

app.get('/images/:key', (c) => imageResponse(c.env, c.req.param('key')));

// ---- Public: catalog and customer orders ----

app.get('/api/catalog', async (c) => {
  const catalog = await listCatalog(c.env.DB, originOf(c));
  c.header('Cache-Control', 'public, max-age=60');
  return c.json(catalog);
});

app.post('/api/orders', async (c) => {
  const input = await readJson(c, orderInput);
  const result = await createOrder(c.env, input);
  return c.json(result, 201);
});

app.post('/api/orders/lookup', async (c) => {
  const { orders } = await readJson(c, orderLookupInput);
  return c.json({ orders: await lookupOrders(c.env.DB, orders) });
});

app.post('/api/orders/:id/cancel', async (c) => {
  const { token } = await readJson(c, orderCancelInput);
  return c.json({ order: await cancelOrderByCustomer(c.env.DB, c.req.param('id'), token) });
});

// ---- Admin sign-in (Google ID token -> session token) ----

app.post('/api/auth/google', async (c) => {
  const { credential } = await readJson(c, googleSignInInput);
  return c.json(await signInWithGoogle(c.env, credential));
});

// ---- Admin: everything below requires a valid admin session ----

const admin = new Hono<AppEnv>();
admin.use('*', requireAdmin);

admin.get('/me', (c) => c.json({ admin: c.get('admin') }));

admin.get('/catalog', async (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json(await listCatalog(c.env.DB, originOf(c)));
});

admin.get('/products/:id', async (c) => {
  const product = await getProduct(c.env.DB, c.req.param('id'), originOf(c));
  if (!product) fail(404, 'Product not found.');
  return c.json({ product });
});

admin.post('/products', async (c) => {
  const input = await readJson(c, productInput);
  return c.json({ product: await createProduct(c.env, input, originOf(c)) }, 201);
});

admin.put('/products/:id', async (c) => {
  const input = await readJson(c, productInput);
  const { product, removedImages } = await updateProduct(c.env, c.req.param('id'), input, originOf(c));
  c.executionCtx.waitUntil(deleteUnusedImages(c.env, removedImages));
  return c.json({ product });
});

admin.delete('/products/:id', async (c) => {
  const images = await deleteProduct(c.env, c.req.param('id'));
  c.executionCtx.waitUntil(deleteUnusedImages(c.env, images));
  return c.json({ ok: true });
});

admin.post('/images', async (c) => {
  const declared = Number(c.req.header('Content-Length') ?? 0);
  if (declared > MAX_IMAGE_BYTES) fail(413, IMAGE_TOO_LARGE);
  const key = await storeImage(c.env, await c.req.arrayBuffer());
  return c.json({ key, url: imageUrl(originOf(c), key) }, 201);
});

/** Discards an upload that was never saved. Images still in use are left alone. */
admin.delete('/images/:key', async (c) => {
  const key = c.req.param('key');
  if (!IMAGE_KEY_RE.test(key)) fail(400, 'Invalid image.');
  if (await isImageReferenced(c.env.DB, key)) return c.json({ ok: true, deleted: false });
  await c.env.IMAGES.delete(key);
  return c.json({ ok: true, deleted: true });
});

admin.post('/categories', async (c) => {
  const input = await readJson(c, categoryInput);
  return c.json({ id: await createCategory(c.env, input) }, 201);
});

admin.put('/categories/:id', async (c) => {
  const input = await readJson(c, categoryInput);
  const removed = await updateCategory(c.env, c.req.param('id'), input);
  c.executionCtx.waitUntil(deleteUnusedImages(c.env, removed));
  return c.json({ ok: true });
});

admin.delete('/categories/:id', async (c) => {
  const removed = await deleteCategory(c.env, c.req.param('id'));
  c.executionCtx.waitUntil(deleteUnusedImages(c.env, removed));
  return c.json({ ok: true });
});

admin.post('/categories/reorder', async (c) => {
  const { ids } = await readJson(c, reorderInput);
  await reorderCategories(c.env.DB, ids);
  return c.json({ ok: true });
});

const orderListQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

admin.get('/orders', async (c) => {
  const filters = parseWith(orderListQuery, c.req.query());
  return c.json(await listOrders(c.env.DB, filters));
});

admin.get('/orders/:id', async (c) => {
  const order = await getOrder(c.env.DB, c.req.param('id'), 'admin');
  if (!order) fail(404, 'Order not found.');
  return c.json({ order });
});

admin.patch('/orders/:id', async (c) => {
  const patch = await readJson(c, orderPatchInput);
  return c.json({ order: await updateOrder(c.env.DB, c.req.param('id'), patch, c.get('admin').email) });
});

admin.delete('/orders/:id', async (c) => {
  await deleteOrder(c.env.DB, c.req.param('id'));
  return c.json({ ok: true });
});

const analyticsQuery = z.object({
  days: z.coerce.number().int().min(0).max(3650).default(30),
});

admin.get('/analytics', async (c) => {
  const { days } = parseWith(analyticsQuery, c.req.query());
  return c.json(await getAnalytics(c.env.DB, days));
});

app.route('/api/admin', admin);

export default {
  fetch: app.fetch,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      sweepOrphanImages(env).then((deleted) => console.log(`Swept ${deleted} unused images`)),
    );
  },
} satisfies ExportedHandler<Bindings>;
