import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function fail(status: ContentfulStatusCode, message: string, code?: string): never {
  throw new HttpError(status, message, code);
}

export function parseWith<T extends z.ZodType>(schema: T, raw: unknown): z.output<T> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue.path.join('.');
  // Zod's built-in messages ("Invalid input: expected string…") don't name the field.
  const message = issue.message.startsWith('Invalid input')
    ? `${field || 'Request body'} is missing or has the wrong type.`
    : issue.message;
  fail(400, message, 'invalid');
}

export async function readJson<T extends z.ZodType>(c: Context, schema: T): Promise<z.output<T>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    fail(400, 'Request body must be JSON.', 'invalid');
  }
  return parseWith(schema, raw);
}
