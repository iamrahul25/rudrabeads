import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const stats = [
  { label: 'Orders', value: '3' },
  { label: 'Wishlist', value: '4' },
  { label: 'Coupons', value: '2' },
];

const menu = [
  { icon: 'receipt-outline' as const, label: 'My Orders' },
  { icon: 'heart-outline' as const, label: 'My Wishlist' },
  { icon: 'location-outline' as const, label: 'Address' },
  { icon: 'card-outline' as const, label: 'Payment Methods' },
  { icon: 'pricetag-outline' as const, label: 'Coupons & Offers' },
];

const support = [
  { icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { icon: 'information-circle-outline' as const, label: 'About RudraBeads' },
];

export default function AccountScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader title="Account" showSearch={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.name}>Rahul Kumar</Text>
            <Pressable accessibilityRole="button">
              <Text style={styles.edit}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stats}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          {menu.map((item) => (
            <Pressable key={item.label} style={styles.row} accessibilityRole="button">
              <View style={styles.rowLeft}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          {support.map((item) => (
            <Pressable key={item.label} style={styles.row} accessibilityRole="button">
              <View style={styles.rowLeft}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Sign Out" variant="outline" style={styles.signOut} />
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
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 24,
    color: colors.surface,
  },
  profileMeta: { gap: 4 },
  name: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 26,
    color: colors.text,
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
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  signOut: {
    marginTop: spacing.md,
  },
});
