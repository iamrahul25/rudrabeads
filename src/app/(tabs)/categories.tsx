import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { ProductImage } from '@/components/ProductImage';
import { useCatalog } from '@/context/CatalogContext';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function CategoriesScreen() {
  const { productColumns, isTablet } = useResponsive();
  const { categories } = useCatalog();
  const featured = categories[0];
  const rest = categories.slice(1);
  const rows: (typeof rest)[] = [];
  for (let index = 0; index < rest.length; index += productColumns) {
    rows.push(rest.slice(index, index + productColumns));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader title="Categories" showSearch showCart />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.searchWrap}
          onPress={() => router.push('/(tabs)/search')}
          accessibilityRole="button"
          accessibilityLabel="Search categories"
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={styles.searchInput}>Search categories</Text>
        </Pressable>

        {featured ? (
          <Pressable
            style={[styles.featured, isTablet && styles.featuredTablet]}
            onPress={() => router.push(`/category/${featured.id}`)}
            accessibilityRole="button"
            accessibilityLabel={featured.name}
          >
            <ProductImage source={featured.image} style={styles.featuredImage} contentFit="cover" />
            <View style={styles.featuredOverlay}>
              <Text style={styles.featuredTitle}>{featured.name}</Text>
              <Text style={styles.featuredCount}>{featured.count} products</Text>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={row[0]?.id ?? rowIndex} style={styles.row}>
              {row.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => router.push(`/category/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                >
                  <ProductImage source={item.image} style={styles.cardImage} contentFit="cover" />
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </View>
                </Pressable>
              ))}
              {Array.from({ length: productColumns - row.length }).map((_, spacerIndex) => (
                <View key={`spacer-${spacerIndex}`} style={styles.spacer} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  searchWrap: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  featured: {
    marginTop: spacing.xl,
    height: 140,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  featuredImage: { ...StyleSheet.absoluteFill },
  featuredOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    backgroundColor: 'rgba(44,24,16,0.35)',
  },
  featuredTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.surface,
  },
  featuredCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.surface,
    opacity: 0.9,
  },
  featuredTablet: {
    height: 220,
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  cardMeta: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
});
