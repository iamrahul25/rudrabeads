import { useCallback, useEffect, useRef } from 'react';

import { useAdmin } from '@/context/AdminContext';
import { discardImage } from '@/lib/adminApi';

/**
 * Tracks images uploaded while editing a form. Uploads that aren't part of the saved result are
 * deleted when the form is saved or left; the worker's daily sweep catches anything missed.
 */
export function useUploadCleanup() {
  const { run } = useAdmin();
  const pending = useRef(new Set<string>());
  const runRef = useRef(run);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const track = useCallback((key: string) => {
    pending.current.add(key);
  }, []);

  /** Call after saving with the keys that are now in use; everything else uploaded is discarded. */
  const settle = useCallback((keptKeys: string[]) => {
    const kept = new Set(keptKeys);
    for (const key of pending.current) {
      if (!kept.has(key)) runRef.current((token) => discardImage(token, key)).catch(() => undefined);
    }
    pending.current.clear();
  }, []);

  useEffect(() => () => settle([]), [settle]);

  return { track, settle };
}
