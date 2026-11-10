import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { signInWithGoogle } from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { loadJSON, removeJSON, saveJSON } from '@/lib/storage';
import type { ApiAdminSession } from '@/shared/api';

const SESSION_KEY = 'admin-session';

function isSession(value: unknown): value is ApiAdminSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<ApiAdminSession>;
  return (
    typeof session.token === 'string' &&
    typeof session.expiresAt === 'number' &&
    !!session.admin &&
    typeof session.admin.email === 'string'
  );
}

type AdminContextValue = {
  hydrated: boolean;
  session: ApiAdminSession | null;
  /** Exchanges a Google ID token for an admin session. Throws ApiError for non-admin accounts. */
  signIn: (googleCredential: string) => Promise<void>;
  signOut: () => void;
  /**
   * Runs an admin API call with the session token. A 401/403 from the server
   * (expired session, or the email was removed from ADMIN_EMAILS) signs the admin out.
   */
  run: <T>(call: (token: string) => Promise<T>) => Promise<T>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ApiAdminSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    loadJSON(SESSION_KEY).then((stored) => {
      if (!alive) return;
      if (isSession(stored) && stored.expiresAt > Date.now()) setSession(stored);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    removeJSON(SESSION_KEY);
  }, []);

  const signIn = useCallback(async (googleCredential: string) => {
    const next = await signInWithGoogle(googleCredential);
    setSession(next);
    saveJSON(SESSION_KEY, next);
  }, []);

  const run = useCallback(
    async <T,>(call: (token: string) => Promise<T>) => {
      if (!session || session.expiresAt <= Date.now()) {
        signOut();
        throw new ApiError('Your session has expired. Please sign in again.', 401, 'unauthenticated');
      }
      try {
        return await call(session.token);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) signOut();
        throw err;
      }
    },
    [session, signOut],
  );

  const value = useMemo(
    () => ({ hydrated, session, signIn, signOut, run }),
    [hydrated, session, signIn, signOut, run],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return value;
}
