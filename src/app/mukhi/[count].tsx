import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductCard } from '@/components/ProductCard';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { useGoBack } from '@/hooks/useGoBack';
import { getProductsByMukhi } from '@/data/products';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function parseMukhiCount(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1) return null;
  return count;
}

export default function MukhiScreen() {
  const params = useLocalSearchParams<{ count: string }>();
  const goBack = useGoBack('/(tabs)');
  const mukhi = parseMukhiCount(params.count);
  const items = mukhi != null ? getProductsByMukhi(mukhi) : [];

  if (mukhi == null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader onBack={goBack} title="Mukhi" />
        <View style={styles.missingWrap}>
          <Text style={styles.missing}>This mukhi selection is not available.</Text>
          <PrimaryButton label="Back to home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  const title = `${mukhi} Mukhi`;
  const countLabel = `${items.length} ${items.length === 1 ? 'product' : 'products'}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader onBack={goBack} showCart />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <UnderlinedHeading textStyle={styles.title} lineWidth={36}>
            {title}
          </UnderlinedHeading>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.intro}>
            All {mukhi} Mukhi rudraksha beads available in the catalogue.
          </Text>
        </View>

        <View style={styles.grid}>
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
        {items.length === 0 ? (
          <Text style={styles.empty}>No {mukhi} Mukhi products in the catalogue yet.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  heading: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.text,
  },
  count: {
    marginTop: spacing.sm,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  intro: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  empty: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
  },
  missingWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  missing: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: colors.text,
  },
});
