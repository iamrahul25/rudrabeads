import { router, useCanGoBack, type Href } from 'expo-router';
import { useCallback } from 'react';

export function useGoBack(fallback: Href = '/') {
  const canGoBack = useCanGoBack();

  return useCallback(() => {
    if (canGoBack) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [canGoBack, fallback]);
}
