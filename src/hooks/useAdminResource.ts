import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';

import { useAdmin } from '@/context/AdminContext';
import { errorMessage } from '@/lib/api';

type State<T> = { settled: string | null; data: T | null; error: string | null };

/**
 * Loads admin data with the session token and reloads when `key` changes.
 * Data from the previous key stays visible while the next request runs.
 */
export function useAdminResource<T>(key: string, load: (token: string) => Promise<T>) {
  const { run } = useAdmin();
  const [state, setState] = useState<State<T>>({ settled: null, data: null, error: null });
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  const waiters = useRef<(() => void)[]>([]);
  const request = `${key}#${version}`;

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    let current = true;
    const finish = (next: Partial<State<T>>) => {
      if (!current) return;
      setState((prev) => ({ ...prev, ...next, settled: request }));
      const resolved = waiters.current;
      waiters.current = [];
      resolved.forEach((resolve) => resolve());
    };
    run(loadRef.current).then(
      (data) => finish({ data, error: null }),
      (err) => finish({ error: errorMessage(err) }),
    );
    return () => {
      current = false;
    };
  }, [request, run]);

  /** Fetches again; resolves once the new data (or error) is in. */
  const reload = useCallback(
    () =>
      new Promise<void>((resolve) => {
        waiters.current.push(resolve);
        setVersion((v) => v + 1);
      }),
    [],
  );

  const setData = useCallback((next: SetStateAction<T | null>) => {
    setState((prev) => ({
      ...prev,
      data: typeof next === 'function' ? (next as (value: T | null) => T | null)(prev.data) : next,
    }));
  }, []);

  return { data: state.data, setData, error: state.error, loading: state.settled !== request, reload };
}
