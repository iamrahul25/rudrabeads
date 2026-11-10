import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { disableGoogleAutoSelect } from '@/components/admin/GoogleSignInButton';
import { ADMIN_MAX_WIDTH } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminContext';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const links: { href: Href; match: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: '/admin', match: '/admin', label: 'Dashboard', icon: 'stats-chart-outline' },
  { href: '/admin/orders', match: '/admin/orders', label: 'Orders', icon: 'receipt-outline' },
  { href: '/admin/products', match: '/admin/products', label: 'Products', icon: 'pricetags-outline' },
  { href: '/admin/categories', match: '/admin/categories', label: 'Categories', icon: 'grid-outline' },
];

export function AdminNav() {
  const pathname = usePathname();
  const { session, signOut } = useAdmin();

  const isActive = (match: string) =>
    match === '/admin' ? pathname === '/admin' : pathname === match || pathname.startsWith(`${match}/`);

  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <Image source={require('../../../assets/logo.webp')} style={styles.logo} contentFit="contain" />
          <Text style={styles.brandText}>RudraBeads Admin</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.links}>
          {links.map((link) => {
            const active = isActive(link.match);
            return (
              <Pressable
                key={link.label}
                onPress={() => router.navigate(link.href)}
                style={[styles.link, active && styles.linkActive]}
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={link.icon} size={16} color={active ? colors.surface : colors.textSecondary} />
                <Text style={[styles.linkText, active && styles.linkTextActive]}>{link.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.account}>
          <Text style={styles.email} numberOfLines={1}>
            {session?.admin.email}
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            style={styles.iconBtn}
            accessibilityRole="link"
            accessibilityLabel="View store"
          >
            <Ionicons name="storefront-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => {
              disableGoogleAutoSelect();
              signOut();
            }}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  inner: {
    width: '100%',
    maxWidth: ADMIN_MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 18, height: 28 },
  brandText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.primary },
  links: { gap: spacing.xs, alignItems: 'center' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    borderRadius: radii.pill,
  },
  linkActive: { backgroundColor: colors.primary },
  linkText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.textSecondary },
  linkTextActive: { color: colors.surface },
  account: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  email: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.textMuted, flexShrink: 1 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
