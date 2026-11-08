import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { products, type Product } from '@/data/products';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const ITEM_WIDTH = 72;
const STRIDE = ITEM_WIDTH + spacing.md;
const IDLE_MS = 2500;
const AUTO_PX_PER_SEC = 42;
const LOOP_PAD = spacing.lg;

const mukhiChips: Product[] = (() => {
  const byMukhi = new Map<number, Product>();
  for (const product of products) {
    if (product.mukhi == null || product.mukhi < 1 || product.mukhi > 21) continue;
    const existing = byMukhi.get(product.mukhi);
    if (
      !existing ||
      (product.categoryId === 'nepali-rudraksha' && existing.categoryId !== 'nepali-rudraksha')
    ) {
      byMukhi.set(product.mukhi, product);
    }
  }
  const oneMukhi = products.find((product) => product.id === '1-mukhi-rudraksha');
  if (oneMukhi) {
    byMukhi.set(1, oneMukhi);
  }
  return [...byMukhi.entries()].sort(([a], [b]) => a - b).map(([, product]) => product);
})();

const LOOP_WIDTH = mukhiChips.length * STRIDE;
const LOOP_COPIES = 3;
/** Middle copy start — keeps infinite loop math aligned with content padding. */
const LOOP_ANCHOR = LOOP_PAD + LOOP_WIDTH;
const WRAP_LOW = LOOP_ANCHOR - LOOP_WIDTH * 0.5;
const WRAP_HIGH = LOOP_ANCHOR + LOOP_WIDTH * 0.5;

function useAutoMotionAllowed() {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    let alive = true;
    const apply = (reduce: boolean) => {
      if (alive) setAllowed(!reduce);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(apply)
      .catch(() => apply(false));

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return allowed;
}

function MukhiChip({ item }: { item: Product }) {
  return (
    <Pressable
      style={styles.circleItem}
      onPress={() => router.push(`/mukhi/${item.mukhi}`)}
      accessibilityRole="button"
      accessibilityLabel={`${item.mukhi} Mukhi`}
    >
      <View style={styles.circle}>
        <Image source={item.image} style={styles.circleImage} contentFit="cover" />
      </View>
      <Text style={styles.circleLabel}>{item.mukhi} Mukhi</Text>
    </Pressable>
  );
}

export function MukhiMarquee() {
  const autoAllowed = useAutoMotionAllowed();
  const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const scrollX = useRef(LOOP_ANCHOR);
  const userDriving = useRef(false);
  const autoActive = useRef(false);
  const programmatic = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);
  const lastFrame = useRef<number | null>(null);
  const wheelIdle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAuto = useCallback(() => {
    autoActive.current = false;
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    lastFrame.current = null;
  }, []);

  const applyScroll = useCallback((x: number) => {
    scrollX.current = x;
    programmatic.current = true;
    scrollRef.current?.scrollTo({ x, animated: false });
    requestAnimationFrame(() => {
      programmatic.current = false;
    });
  }, []);

  const wrapOffset = useCallback((x: number) => {
    if (LOOP_WIDTH <= 0) return x;
    if (x < WRAP_LOW) return x + LOOP_WIDTH;
    if (x > WRAP_HIGH) return x - LOOP_WIDTH;
    return x;
  }, []);

  const startAuto = useCallback(() => {
    if (!autoAllowed || userDriving.current || LOOP_WIDTH <= 0) return;
    stopAuto();
    autoActive.current = true;

    const step = (ts: number) => {
      if (!autoActive.current || userDriving.current) {
        stopAuto();
        return;
      }
      const prev = lastFrame.current ?? ts;
      const dt = Math.min(32, ts - prev);
      lastFrame.current = ts;

      const next = wrapOffset(scrollX.current + (AUTO_PX_PER_SEC * dt) / 1000);
      applyScroll(next);

      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
  }, [autoAllowed, applyScroll, stopAuto, wrapOffset]);

  const scheduleAutoAfterIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      userDriving.current = false;
      if (autoAllowed) startAuto();
    }, IDLE_MS);
  }, [autoAllowed, startAuto]);

  const onUserScrollStart = useCallback(() => {
    userDriving.current = true;
    stopAuto();
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, [stopAuto]);

  const onUserScrollEnd = useCallback(
    (event?: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (event) {
        const x = event.nativeEvent.contentOffset.x;
        scrollX.current = wrapOffset(x);
      }
      scheduleAutoAfterIdle();
    },
    [scheduleAutoAfterIdle, wrapOffset],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (programmatic.current) return;

      const x = event.nativeEvent.contentOffset.x;
      scrollX.current = x;

      if (!userDriving.current) return;

      const wrapped = wrapOffset(x);
      if (wrapped !== x) {
        applyScroll(wrapped);
      }
    },
    [applyScroll, wrapOffset],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      applyScroll(LOOP_ANCHOR);
      if (autoAllowed) startAuto();
    }, 80);
    return () => {
      clearTimeout(t);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (wheelIdle.current) clearTimeout(wheelIdle.current);
      stopAuto();
    };
  }, [applyScroll, autoAllowed, startAuto, stopAuto]);

  const onWebWheel = useCallback(() => {
    onUserScrollStart();
    if (wheelIdle.current) clearTimeout(wheelIdle.current);
    wheelIdle.current = setTimeout(() => {
      onUserScrollEnd();
    }, 200);
  }, [onUserScrollEnd, onUserScrollStart]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      nestedScrollEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      decelerationRate="fast"
      contentContainerStyle={styles.row}
      accessibilityLabel="Shop by mukhi. Drag to browse; auto-scroll resumes after a short pause."
      onScroll={onScroll}
      onScrollBeginDrag={onUserScrollStart}
      onScrollEndDrag={onUserScrollEnd}
      onMomentumScrollBegin={onUserScrollStart}
      onMomentumScrollEnd={onUserScrollEnd}
      {...(Platform.OS === 'web'
        ? {
            onTouchStart: onUserScrollStart,
            onTouchEnd: () => onUserScrollEnd(),
            onMouseDown: onUserScrollStart,
            onMouseUp: () => onUserScrollEnd(),
            onWheel: onWebWheel,
          }
        : {})}
    >
      {Array.from({ length: LOOP_COPIES }, (_, copy) => (
        <View
          key={copy}
          style={styles.copy}
          accessibilityElementsHidden={copy !== 1}
          importantForAccessibility={copy !== 1 ? 'no-hide-descendants' : 'auto'}
        >
          {mukhiChips.map((item) => (
            <MukhiChip key={`${copy}-${item.mukhi}`} item={item} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: LOOP_PAD,
    flexDirection: 'row',
  },
  copy: {
    flexDirection: 'row',
  },
  circleItem: {
    width: ITEM_WIDTH,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  circleImage: { width: '100%', height: '100%' },
  circleLabel: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
