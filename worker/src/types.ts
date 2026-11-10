export type Bindings = {
  DB: D1Database;
  IMAGES: KVNamespace;
  ADMIN_EMAILS: string;
  GOOGLE_CLIENT_ID: string;
  ALLOWED_ORIGINS?: string;
  SESSION_SECRET?: string;
};

export type Admin = { email: string; name: string; picture: string };

export type AppEnv = {
  Bindings: Bindings;
  Variables: { admin: Admin };
};
