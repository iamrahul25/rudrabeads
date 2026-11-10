import { z } from 'zod';

import type { ApiCategoryInput, ApiOrderPatch, ApiProductInput } from '../../src/shared/api';
import { MAX_LINE_QTY, MAX_ORDER_LINES, ORDER_STATUSES, PAYMENT_STATUSES } from '../../src/shared/orders';
import { IMAGE_KEY_RE, MAX_PRODUCT_IMAGES } from './images';

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .nullish()
    .transform((value) => value || null);

const optionalInt = (min: number, max: number, label: string) =>
  z
    .number()
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`)
    .nullish()
    .transform((value) => value ?? null);

const imageKey = z.string().regex(IMAGE_KEY_RE, 'One of the images is invalid. Please upload it again.');

export const productInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(120, 'Name must be 120 characters or fewer.'),
  categoryId: z.string().trim().min(1, 'Choose a category.'),
  sku: optionalText(40, 'SKU'),
  price: optionalInt(0, 10_000_000, 'Price'),
  priceUnit: optionalText(20, 'Price unit'),
  minOrderQty: optionalInt(1, MAX_LINE_QTY, 'Minimum order quantity'),
  minOrderUnit: optionalText(20, 'Minimum order unit'),
  mukhi: optionalInt(1, 30, 'Mukhi'),
  origin: optionalText(80, 'Origin'),
  beadSize: optionalText(80, 'Bead size'),
  certification: optionalText(80, 'Certification'),
  labName: optionalText(80, 'Lab name'),
  treatment: optionalText(80, 'Treatment'),
  rulingDeity: optionalText(80, 'Ruling deity'),
  rulingPlanet: optionalText(80, 'Ruling planet'),
  usage: optionalText(200, 'Usage'),
  shape: optionalText(80, 'Shape'),
  color: optionalText(80, 'Color'),
  material: optionalText(80, 'Material'),
  specs: z
    .record(
      z.string().trim().min(1, 'Specification names cannot be empty.').max(60, 'Specification names must be 60 characters or fewer.'),
      z.string().trim().max(300, 'Specification values must be 300 characters or fewer.'),
    )
    .default({})
    .transform((specs) => Object.fromEntries(Object.entries(specs).filter(([, value]) => value)))
    .refine((specs) => Object.keys(specs).length <= 30, 'A product can have at most 30 specifications.'),
  description: z.string().trim().max(5000, 'Description must be 5000 characters or fewer.').default(''),
  images: z
    .array(imageKey)
    .max(MAX_PRODUCT_IMAGES, `A product can have at most ${MAX_PRODUCT_IMAGES} images.`)
    .default([])
    .refine((keys) => new Set(keys).size === keys.length, 'The same image is added twice.'),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export type ProductInput = z.output<typeof productInput>;

export const categoryInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be 80 characters or fewer.'),
  intro: z.string().trim().max(1000, 'Intro must be 1000 characters or fewer.').default(''),
  imageKey: imageKey.nullish().transform((value) => value ?? null),
});

export type CategoryInput = z.output<typeof categoryInput>;

export const reorderInput = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

const addressText = z.string().max(300);

export const orderInput = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(100),
        qty: z.number().int('Quantities must be whole numbers.').min(1).max(MAX_LINE_QTY),
      }),
    )
    .min(1, 'Your cart is empty.')
    .max(MAX_ORDER_LINES, `An order can have at most ${MAX_ORDER_LINES} different items.`),
  address: z.object({
    fullName: addressText,
    phone: addressText,
    email: addressText.default(''),
    line1: addressText,
    line2: addressText.default(''),
    city: addressText,
    state: addressText,
    pincode: addressText,
  }),
  /** The total the customer saw; a mismatch means prices changed since the app loaded them. */
  expectedTotal: z.number().int().min(0).nullish(),
});

const orderToken = z.string().regex(/^[0-9a-f]{64}$/, 'Invalid order token.');

export const orderLookupInput = z.object({
  orders: z
    .array(z.object({ id: z.string().min(1).max(40), token: orderToken }))
    .max(50),
});

export const orderCancelInput = z.object({ token: orderToken });

export const orderPatchInput = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  courier: z.string().trim().max(80, 'Courier must be 80 characters or fewer.').optional(),
  trackingNumber: z.string().trim().max(80, 'Tracking number must be 80 characters or fewer.').optional(),
  adminNote: z.string().trim().max(2000, 'Note must be 2000 characters or fewer.').optional(),
});

export type OrderPatchInput = z.output<typeof orderPatchInput>;

export const googleSignInInput = z.object({
  credential: z.string().min(10).max(10_000),
});

/** Fails to compile when the app's request types (src/shared/api.ts) stop matching these schemas. */
type Accepts<Schema extends z.ZodType, Body extends z.input<Schema>> = Body;
export type RequestTypesMatch = [
  Accepts<typeof productInput, ApiProductInput>,
  Accepts<typeof categoryInput, ApiCategoryInput>,
  Accepts<typeof orderPatchInput, ApiOrderPatch>,
];
