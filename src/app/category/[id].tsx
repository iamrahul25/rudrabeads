import { router, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductGrid } from '@/components/ProductGrid';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { getCategoryById, getProductsByCategory } from '@/data/products';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function CategoryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const goBack = useGoBack('/(tabs)/categories');
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const category = id ? getCategoryById(id) : undefined;
  const items = category ? getProductsByCategory(category.id) : [];

  if (!category) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader onBack={goBack} title="Category" />
        <View style={styles.missingWrap}>
          <Text style={styles.missing}>This category is not available.</Text>
          <PrimaryButton label="Back to categories" onPress={() => router.replace('/(tabs)/categories')} />
        </View>
      </SafeAreaView>
    );
  }

  const countLabel = `${items.length} ${items.length === 1 ? 'product' : 'products'}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader onBack={goBack} showCart />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <UnderlinedHeading textStyle={styles.title} lineWidth={36}>
            {category.name}
          </UnderlinedHeading>
          <Text style={styles.count}>{countLabel}</Text>
          {category.intro ? <Text style={styles.intro}>{category.intro}</Text> : null}
        </View>

        <ProductGrid products={items} style={styles.grid} />
        {items.length === 0 ? <Text style={styles.empty}>No products in this category yet.</Text> : null}
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
