import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { AboutUs } from '@/components/info/AboutUs';
import { ContactUs } from '@/components/info/ContactUs';
import { RudrakshaGuide } from '@/components/info/RudrakshaGuide';
import { infoStyles } from '@/components/info/styles';
import { Testimonials } from '@/components/info/Testimonials';
import { business } from '@/data/business';
import { useGoBack } from '@/hooks/useGoBack';
import { useResponsive } from '@/hooks/useResponsive';
import { coupons, couponsEnabled, describeCoupon } from '@/lib/coupons';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const titles = {
  offers: 'Coupons & Offers',
  help: 'Help & Support',
  about: 'About Us',
  contact: 'Contact Us',
  testimonials: 'Testimonials',
  guide: 'Rudraksha Guide',
} as const;

type Page = keyof typeof titles;

const isPage = (value: string): value is Page => value in titles;

const openUrl = (url: string) => Linking.openURL(url).catch(() => undefined);

function Offers() {
  if (!couponsEnabled) {
    return (
      <View style={[styles.card, styles.soon]}>
        <Ionicons name="pricetag-outline" size={32} color={colors.primary} />
        <Text style={styles.cardTitle}>Coming soon</Text>
        <Text style={[styles.paragraph, styles.soonText]}>
          Coupons and offers will be available here shortly.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.paragraph}>Apply a code on the cart screen to get the discount.</Text>
      {coupons.map((coupon) => (
        <View key={coupon.code} style={styles.card}>
          <View style={styles.codeBadge}>
            <Text style={styles.code} selectable>
              {coupon.code}
            </Text>
          </View>
          <Text style={styles.cardTitle}>{coupon.title}</Text>
          <Text style={styles.paragraph}>{describeCoupon(coupon)}</Text>
        </View>
      ))}
    </>
  );
}

function Help() {
  const rows = [
    {
      icon: 'call-outline' as const,
      label: `Call ${business.phone}`,
      onPress: () => openUrl(`tel:${business.phone}`),
    },
    {
      icon: 'location-outline' as const,
      label: business.address,
      onPress: () =>
        openUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`),
    },
  ];
  return (
    <>
      <Text style={styles.paragraph}>
        For orders, bulk enquiries or questions about a product, reach us directly.
      </Text>
      <View style={styles.list}>
        {rows.map((row) => (
          <Pressable key={row.label} style={styles.row} onPress={row.onPress} accessibilityRole="link">
            <Ionicons name={row.icon} size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, styles.rowFill]}>{row.label}</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

export default function InfoScreen() {
  const params = useLocalSearchParams<{ page: string }>();
  const goBack = useGoBack('/(tabs)/account');
  const { isTablet } = useResponsive();
  const page = isPage(String(params.page)) ? (String(params.page) as Page) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title={page ? titles[page] : 'Info'} onBack={goBack} />
      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        keyboardShouldPersistTaps="handled"
      >
        {page === 'offers' ? <Offers /> : null}
        {page === 'help' ? <Help /> : null}
        {page === 'about' ? <AboutUs /> : null}
        {page === 'contact' ? <ContactUs /> : null}
        {page === 'testimonials' ? <Testimonials /> : null}
        {page === 'guide' ? <RudrakshaGuide /> : null}
        {page == null ? <Text style={styles.paragraph}>This page is not available.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...infoStyles,
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  contentTablet: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  rowFill: { flex: 1 },
  soon: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  soonText: {
    textAlign: 'center',
  },
  codeBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  code: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    letterSpacing: 1,
    color: colors.primary,
  },
});
