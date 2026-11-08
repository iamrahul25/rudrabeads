import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { useCart } from '@/context/CartContext';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  /** Full RudraBeads mark — used on Home / Categories-style screens */
  showBrand?: boolean;
  title?: string;
  onBack?: () => void;
  showSearch?: boolean;
  showCart?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  showShare?: boolean;
  showWishlist?: boolean;
  cartCount?: number;
  onShare?: () => void;
  onWishlist?: () => void;
  onSettings?: () => void;
  wishlistActive?: boolean;
};

const logoSource = require('../../assets/logo.png');
const brandTextSource = require('../../assets/brand-text.webp');

/** Display width for wordmark from asset aspect ratio (991×232). */
const BRAND_WORDMARK_WIDTH = Math.round((991 / 232) * 26);

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <Image
        source={logoSource}
        style={styles.logoImage}
        contentFit="contain"
        accessibilityLabel="RudraBeads trishula mark"
      />
      <Image
        source={brandTextSource}
        style={styles.brandWordmark}
        contentFit="contain"
        accessibilityLabel="RudraBeads"
      />
    </View>
  );
}

export function BrandHeader({
  showBrand = false,
  title,
  onBack,
  showSearch = false,
  showCart = false,
  showNotifications = false,
  showSettings = false,
  showShare = false,
  showWishlist = false,
  cartCount,
  onShare,
  onWishlist,
  onSettings,
  wishlistActive = false,
}: Props) {
  const { count } = useCart();
  const badgeCount = cartCount ?? count;
  const left = onBack ? (
    <View style={styles.leftGroup}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.iconBtn}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      {title ? (
        <UnderlinedHeading textStyle={styles.inlineTitle} lineWidth={24}>
          {title}
        </UnderlinedHeading>
      ) : null}
    </View>
  ) : showBrand ? (
    <BrandMark />
  ) : title ? (
    <UnderlinedHeading textStyle={styles.pageTitle} lineWidth={28}>
      {title}
    </UnderlinedHeading>
  ) : (
    <View style={styles.flex} />
  );

  return (
    <View style={styles.row}>
      {left}
      {onBack || showBrand || title ? <View style={styles.flex} /> : null}

      <View style={styles.actions}>
        {showNotifications ? (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        {showSearch ? (
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={styles.iconBtn}
          >
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        {showShare ? (
          <Pressable
            onPress={onShare}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={styles.iconBtn}
          >
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        {showWishlist ? (
          <Pressable
            onPress={onWishlist}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
            style={styles.iconBtn}
          >
            <Ionicons
              name={wishlistActive ? 'heart' : 'heart-outline'}
              size={22}
              color={wishlistActive ? colors.primary : colors.text}
            />
          </Pressable>
        ) : null}
        {showSettings ? (
          <Pressable
            onPress={onSettings}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={styles.iconBtn}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        {showCart ? (
          <Pressable
            onPress={() => router.push('/cart')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={badgeCount > 0 ? `Cart, ${badgeCount} items` : 'Cart'}
            style={styles.iconBtn}
          >
            <Ionicons name="bag-handle-outline" size={22} color={colors.text} />
            {badgeCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  logoImage: {
    width: 18,
    height: 28,
  },
  brandWordmark: {
    width: BRAND_WORDMARK_WIDTH,
    height: 26,
  },
  pageTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  inlineTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
    flexShrink: 1,
  },
  flex: { flex: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
});
