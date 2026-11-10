import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';

import { loadJSON, saveJSON } from '@/lib/storage';

/**
 * State mirrored to AsyncStorage. `sanitize` must be referentially stable
 * (module-level) and turn whatever was stored into a valid value.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  sanitize: (stored: unknown) => T,
) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const touchedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    loadJSON(key).then((stored) => {
      if (!alive) return;
      if (!touchedRef.current && stored !== undefined) {
        setValue(sanitize(stored));
      }
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, [key, sanitize]);

  useEffect(() => {
    if (hydrated) saveJSON(key, value);
  }, [hydrated, key, value]);

  const update = useCallback((next: SetStateAction<T>) => {
    touchedRef.current = true;
    setValue(next);
  }, []);

  return [value, update, hydrated] as const;
}
