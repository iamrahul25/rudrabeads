import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { Chip } from '@/components/Chip';
import { FilterSheet } from '@/components/FilterSheet';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductGrid } from '@/components/ProductGrid';
import { SortSheet } from '@/components/SortSheet';
import { useCatalog } from '@/context/CatalogContext';
import {
  countSheetFilters,
  defaultFilters,
  describeActiveFilters,
  searchProducts,
  sortOptions,
  type SearchFilters,
} from '@/lib/search';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function SearchScreen() {
  const { products, mukhiFilters, getCategoryById } = useCatalog();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [sheet, setSheet] = useState<'filters' | 'sort' | null>(null);

  const results = useMemo(() => searchProducts(products, query, filters), [products, query, filters]);
  const activeFilters = useMemo(
    () => describeActiveFilters(filters, (id) => getCategoryById(id)?.name ?? id),
    [filters, getCategoryById],
  );
  const sheetFilterCount = countSheetFilters(filters);
  const sortLabel = sortOptions.find((option) => option.key === filters.sort)?.label ?? 'Relevance';
  const isFiltered = sheetFilterCount > 0 || filters.mukhi != null;

  const resetAll = () => {
    setQuery('');
    setFilters(defaultFilters);
  };

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
          autoCorrect={false}
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
            const value = filter === 'All' ? null : Number(filter.split(' ')[0]);
            return (
              <Chip
                key={filter}
                label={filter}
                selected={filters.mukhi === value}
                onPress={() => setFilters((prev) => ({ ...prev, mukhi: value }))}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.resultCount} accessibilityLiveRegion="polite">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </Text>
        <View style={styles.toolbarActions}>
          <Pressable
            style={styles.toolBtn}
            onPress={() => setSheet('sort')}
            accessibilityRole="button"
            accessibilityLabel={`Sort by, ${sortLabel}`}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.text} />
            <Text style={styles.toolText} numberOfLines={1}>
              {filters.sort === 'relevance' ? 'Sort' : sortLabel}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toolBtn, sheetFilterCount > 0 && styles.toolBtnActive]}
            onPress={() => setSheet('filters')}
            accessibilityRole="button"
            accessibilityLabel={
              sheetFilterCount > 0 ? `Filters, ${sheetFilterCount} applied` : 'Filters'
            }
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={sheetFilterCount > 0 ? colors.surface : colors.text}
            />
            <Text style={[styles.toolText, sheetFilterCount > 0 && styles.toolTextActive]}>
              Filters{sheetFilterCount > 0 ? ` (${sheetFilterCount})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      {activeFilters.length > 0 ? (
        <View style={styles.filtersWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filters}
          >
            {activeFilters.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                selected
                removable
                onPress={() => setFilters(filter.clear)}
              />
            ))}
            <Pressable
              onPress={() => setFilters((prev) => ({ ...defaultFilters, mukhi: prev.mukhi, sort: prev.sort }))}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.clearAll}>Clear all</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProductGrid products={results} />
        {results.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              {query.trim()
                ? `Nothing matches "${query.trim()}"${isFiltered ? ' with the current filters' : ''}.`
                : 'No products match the current filters.'}
            </Text>
            <PrimaryButton label="Reset search" variant="outline" onPress={resetAll} />
          </View>
        ) : null}
      </ScrollView>

      {sheet === 'filters' ? (
        <FilterSheet
          query={query}
          filters={filters}
          onClose={() => setSheet(null)}
          onApply={(next) => {
            setFilters(next);
            setSheet(null);
          }}
        />
      ) : null}
      {sheet === 'sort' ? (
        <SortSheet
          value={filters.sort}
          onClose={() => setSheet(null)}
          onChange={(sort) => {
            setFilters((prev) => ({ ...prev, sort }));
            setSheet(null);
          }}
        />
      ) : null}
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
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  resultCount: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 1,
  },
  toolBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  toolBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toolText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
    flexShrink: 1,
  },
  toolTextActive: {
    color: colors.surface,
  },
  clearAll: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.primary,
    paddingHorizontal: spacing.xs,
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  emptyText: {
    marginBottom: spacing.sm,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
