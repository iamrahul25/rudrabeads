import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { categories } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function CategoriesScreen() {
  const featured = categories[0];
  const rest = categories.slice(1);

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

        <Pressable
          style={styles.featured}
          onPress={() => router.push('/(tabs)/search')}
          accessibilityRole="button"
        >
          <Image source={featured.image} style={styles.featuredImage} contentFit="cover" />
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredTitle}>{featured.name}</Text>
            <Text style={styles.featuredCount}>{featured.count} products</Text>
          </View>
        </Pressable>

        <View style={styles.grid}>
          {rest.map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => router.push('/(tabs)/search')}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <Image source={item.image} style={styles.cardImage} contentFit="cover" />
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 96,
  },
  cardMeta: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
});
