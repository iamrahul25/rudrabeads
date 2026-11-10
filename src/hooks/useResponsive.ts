import { useWindowDimensions } from 'react-native';

export const TABLET_BREAKPOINT = 600;
export const WIDE_BREAKPOINT = 900;

/** Product grid columns for a given viewport width. */
export function getProductColumns(width: number) {
  if (width >= 1200) return 5;
  if (width >= WIDE_BREAKPOINT) return 4;
  if (width >= TABLET_BREAKPOINT) return 3;
  return 2;
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isTablet: width >= TABLET_BREAKPOINT,
    isWide: width >= WIDE_BREAKPOINT,
    productColumns: getProductColumns(width),
  };
}
