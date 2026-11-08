import { Ionicons } from '@expo/vector-icons';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from 'expo-router/tabs';
import { useContext } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const DESKTOP_BREAKPOINT = 768;
const DESKTOP_DOCK_MAX_WIDTH = 520;

const TAB_ICONS = {
  index: { outline: 'home-outline', solid: 'home', label: 'Home' },
  categories: { outline: 'grid-outline', solid: 'grid', label: 'Categories' },
  search: { outline: 'search-outline', solid: 'search', label: 'Search' },
  wishlist: { outline: 'heart-outline', solid: 'heart', label: 'Wishlist' },
  account: { outline: 'person-outline', solid: 'person', label: 'Account' },
} as const;

type TabRouteName = keyof typeof TAB_ICONS;

export function AppTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const bottomPad = Math.max(insets.bottom, isDesktop ? spacing.sm : spacing.xs);

  return (
    <View
      style={[styles.shell, isDesktop && styles.shellDesktop]}
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}
    >
      <View
        role="tablist"
        style={[
          styles.bar,
          {
            paddingBottom: bottomPad,
            paddingLeft: Math.max(insets.left, spacing.sm),
            paddingRight: Math.max(insets.right, spacing.sm),
          },
          isDesktop && styles.barDesktop,
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const meta = TAB_ICONS[route.name as TabRouteName];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? meta?.label ?? route.name;
          const color = focused ? colors.primary : colors.textMuted;
          const iconName = focused
            ? (meta?.solid ?? 'ellipse')
            : (meta?.outline ?? 'ellipse-outline');

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              role="tab"
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? String(label)}
              onPress={onPress}
              onLongPress={() =>
                emitter.emit({ type: 'tabLongPress', target: route.key })
              }
              android_ripple={undefined}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={styles.indicatorSlot}>
                <View
                  style={[
                    styles.indicator,
                    focused ? styles.indicatorActive : styles.indicatorIdle,
                  ]}
                />
              </View>
              <Ionicons name={iconName} size={22} color={color} />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color },
                  focused && styles.labelActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  shellDesktop: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: spacing.xs,
    backgroundColor: colors.surface,
  },
  barDesktop: {
    width: '100%',
    maxWidth: DESKTOP_DOCK_MAX_WIDTH,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(44, 24, 16, 0.08)',
      },
      default: {
        elevation: 6,
        shadowColor: colors.text,
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    cursor: 'pointer',
  },
  itemPressed: {
    opacity: 0.72,
  },
  indicatorSlot: {
    height: 3,
    width: '100%',
    alignItems: 'center',
    marginBottom: 2,
  },
  indicator: {
    height: 3,
    width: 18,
    borderRadius: radii.pill,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  indicatorIdle: {
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: 'DMSans_600SemiBold',
  },
});
