import type { MiddlewareHandler } from 'hono';
import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

import { fail, HttpError } from './http';
import type { Admin, AppEnv, Bindings } from './types';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

const SESSION_AUDIENCE = 'rudrabeads-admin';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function adminEmails(env: Bindings) {
  return new Set(
    (env.ADMIN_EMAILS ?? '')
      .split(/[\s,]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function sessionKey(env: Bindings) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    fail(500, 'SESSION_SECRET is not configured on the server (needs at least 32 characters).');
  }
  return new TextEncoder().encode(env.SESSION_SECRET);
}

/** Verifies a Google Identity Services ID token and, for allowed admins, issues a session token. */
export async function signInWithGoogle(env: Bindings, credential: string) {
  if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.startsWith('REPLACE_')) {
    fail(500, 'GOOGLE_CLIENT_ID is not configured on the server.');
  }
  const key = sessionKey(env);

  let claims: Record<string, unknown>;
  try {
    const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: env.GOOGLE_CLIENT_ID,
    });
    claims = payload;
  } catch {
    fail(401, 'Google sign-in could not be verified. Please try again.', 'google_invalid');
  }

  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
  if (!email || claims.email_verified !== true) {
    fail(403, 'This Google account does not have a verified email.', 'not_admin');
  }
  if (!adminEmails(env).has(email)) {
    fail(403, `${email} is not an admin account.`, 'not_admin');
  }

  const admin: Admin = {
    email,
    name: typeof claims.name === 'string' ? claims.name : email,
    picture: typeof claims.picture === 'string' ? claims.picture : '',
  };
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await new SignJWT({ name: admin.name, picture: admin.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key);

  return { token, admin, expiresAt: expiresAt * 1000 };
}

/**
 * Accepts `Authorization: Bearer <session token>` and re-checks the email against ADMIN_EMAILS
 * on every request, so removing an email from the list revokes access immediately.
 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) fail(401, 'Please sign in.', 'unauthenticated');
  const key = sessionKey(c.env);

  let admin: Admin;
  try {
    const { payload } = await jwtVerify(token, key, {
      audience: SESSION_AUDIENCE,
      algorithms: ['HS256'],
    });
    admin = {
      email: (payload.sub ?? '').toLowerCase(),
      name: typeof payload.name === 'string' ? payload.name : '',
      picture: typeof payload.picture === 'string' ? payload.picture : '',
    };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    fail(401, 'Your session has expired. Please sign in again.', 'unauthenticated');
  }

  if (!adminEmails(c.env).has(admin.email)) {
    fail(403, 'This account no longer has admin access.', 'not_admin');
  }
  c.set('admin', admin);
  await next();
};
