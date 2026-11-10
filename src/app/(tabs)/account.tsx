import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAccount } from '@/context/AccountContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { couponsEnabled } from '@/lib/coupons';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href?: Href;
  note?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function AccountScreen() {
  const account = useAccount();
  const wishlist = useWishlist();
  const cart = useCart();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    if (!confirmSignOut) return undefined;
    const timer = setTimeout(() => setConfirmSignOut(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmSignOut]);

  const { profile, orders, address } = account;
  const hasProfile = profile.name.trim().length > 0;

  const stats: { label: string; value: number; href: Href }[] = [
    { label: 'Orders', value: orders.length, href: '/orders' },
    { label: 'Wishlist', value: wishlist.count, href: '/(tabs)/wishlist' },
    { label: 'In Cart', value: cart.lineCount, href: '/cart' },
  ];

  const menu: MenuItem[] = [
    { icon: 'receipt-outline', label: 'My Orders', href: '/orders' },
    { icon: 'heart-outline', label: 'My Wishlist', href: '/(tabs)/wishlist' },
    {
      icon: 'location-outline',
      label: 'Address',
      href: '/address',
      note: address ? address.city : 'Add',
    },
    { icon: 'card-outline', label: 'Payment Methods', note: 'Coming soon' },
    couponsEnabled
      ? { icon: 'pricetag-outline', label: 'Coupons & Offers', href: '/info/offers' }
      : { icon: 'pricetag-outline', label: 'Coupons & Offers', note: 'Coming soon' },
  ];

  const support: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help & Support', href: '/info/help' },
    { icon: 'chatbubbles-outline', label: 'Contact Us', href: '/info/contact' },
    { icon: 'star-outline', label: 'Testimonials', href: '/info/testimonials' },
    { icon: 'information-circle-outline', label: 'About Us', href: '/info/about' },
  ];

  const signOut = () => {
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      return;
    }
    account.signOut();
    wishlist.clear();
    cart.clear();
    setConfirmSignOut(false);
  };

  const renderSection = (items: MenuItem[]) => (
    <View style={styles.section}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          style={[styles.row, !item.href && styles.rowDisabled]}
          onPress={item.href ? () => router.push(item.href!) : undefined}
          disabled={!item.href}
          accessibilityRole="button"
          accessibilityState={{ disabled: !item.href }}
        >
          <View style={styles.rowLeft}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
            <Text style={styles.rowLabel}>{item.label}</Text>
          </View>
          <View style={styles.rowRight}>
            {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
            {item.href ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
          </View>
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader title="Account" showSettings onSettings={() => router.push('/profile')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            {hasProfile ? (
              <Text style={styles.avatarText}>{initials(profile.name)}</Text>
            ) : (
              <Ionicons name="person" size={28} color={colors.surface} />
            )}
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.name}>{hasProfile ? profile.name : 'Guest'}</Text>
            {profile.phone ? <Text style={styles.contact}>{profile.phone}</Text> : null}
            <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.edit}>{hasProfile ? 'Edit Profile' : 'Add your details'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stats}>
          {stats.map((item) => (
            <Pressable
              key={item.label}
              style={styles.statCard}
              onPress={() => router.push(item.href)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}: ${item.value}`}
            >
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {renderSection(menu)}
        {renderSection(support)}

        {hasProfile || orders.length > 0 ? (
          <PrimaryButton
            label={confirmSignOut ? 'Tap again to sign out' : 'Sign Out'}
            variant="outline"
            style={styles.signOut}
            onPress={signOut}
          />
        ) : null}
        {confirmSignOut ? (
          <Text style={styles.signOutNote}>
            This clears your profile, address, orders, wishlist and cart from this device.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: colors.surface,
  },
  profileMeta: { gap: 4, flexShrink: 1 },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: colors.text,
  },
  contact: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  edit: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: colors.primary,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  rowNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  signOut: {
    marginTop: spacing.md,
  },
  signOutNote: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
