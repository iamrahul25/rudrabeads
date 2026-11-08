import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { ProductCard } from '@/components/ProductCard';
import { mukhiFilters, products } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((item) => {
      const matchesMukhi =
        activeFilter === 'All' || item.mukhi === Number(activeFilter.split(' ')[0]);
      if (!matchesMukhi) return false;
      if (!normalized) return true;
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized) ||
        (item.origin?.toLowerCase().includes(normalized) ?? false)
      );
    });
  }, [activeFilter, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader title="Search" showCart />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search rudraksha, mala, mukhi..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel="Search products"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filters}
        >
          {mukhiFilters.map((filter) => {
            const active = filter === activeFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.row}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No products match your search.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  filtersWrap: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.surface,
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  row: {
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
});
