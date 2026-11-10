import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { categories, formatINR, products } from '@/data/products';
import {
  defaultFilters,
  facetValues,
  formatPriceRange,
  parsePriceInput,
  pricePresets,
  searchProducts,
  toggleValue,
  type SearchFilters,
} from '@/lib/search';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const origins = facetValues(products, 'origin');
const certifications = facetValues(products, 'certification');
const pricedValues = products.map((p) => p.price).filter((p): p is number => p != null);
const catalogMin = Math.min(...pricedValues);
const catalogMax = Math.max(...pricedValues);

type Props = {
  query: string;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
};

const toText = (value: number | null) => (value == null ? '' : String(value));

export function FilterSheet({ query, filters, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(filters);
  const [minText, setMinText] = useState(toText(filters.minPrice));
  const [maxText, setMaxText] = useState(toText(filters.maxPrice));

  const effective = useMemo(
    () => ({ ...draft, minPrice: parsePriceInput(minText), maxPrice: parsePriceInput(maxText) }),
    [draft, minText, maxText],
  );
  const resultCount = useMemo(
    () => searchProducts(products, query, effective).length,
    [query, effective],
  );

  const setPrice = (min: number | null, max: number | null) => {
    setMinText(toText(min));
    setMaxText(toText(max));
  };

  const clearAll = () => {
    setDraft({ ...defaultFilters, mukhi: draft.mukhi, sort: draft.sort });
    setPrice(null, null);
  };

  return (
    <BottomSheet
      title="Filters"
      onClose={onClose}
      footer={
        <>
          <PrimaryButton label="Clear all" variant="outline" onPress={clearAll} style={styles.footerBtn} />
          <PrimaryButton
            label={resultCount === 0 ? 'No results' : `Show ${resultCount} ${resultCount === 1 ? 'result' : 'results'}`}
            disabled={resultCount === 0}
            onPress={() => onApply(effective)}
            style={styles.footerBtnWide}
          />
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Price</Text>
        <View style={styles.wrap}>
          {pricePresets.map((preset) => {
            const selected = effective.minPrice === preset.min && effective.maxPrice === preset.max;
            return (
              <Chip
                key={`${preset.min}-${preset.max}`}
                label={formatPriceRange(preset.min, preset.max)}
                selected={selected}
                onPress={() => (selected ? setPrice(null, null) : setPrice(preset.min, preset.max))}
              />
            );
          })}
        </View>
        <View style={styles.priceInputs}>
          <View style={styles.priceField}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              value={minText}
              onChangeText={(text) => setMinText(text.replace(/\D/g, ''))}
              placeholder="Min"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              inputMode="numeric"
              accessibilityLabel="Minimum price"
              style={styles.priceInput}
            />
          </View>
          <Text style={styles.to}>to</Text>
          <View style={styles.priceField}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              value={maxText}
              onChangeText={(text) => setMaxText(text.replace(/\D/g, ''))}
              placeholder="Max"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              inputMode="numeric"
              accessibilityLabel="Maximum price"
              style={styles.priceInput}
            />
          </View>
        </View>
        <Text style={styles.hint}>
          Catalogue prices range from {formatINR(catalogMin)} to {formatINR(catalogMax)}. Items with
          price on request are hidden when a price is set.
        </Text>

        <Text style={styles.section}>Category</Text>
        <View style={styles.wrap}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.name} (${category.count})`}
              selected={draft.categoryIds.includes(category.id)}
              onPress={() =>
                setDraft((prev) => ({ ...prev, categoryIds: toggleValue(prev.categoryIds, category.id) }))
              }
            />
          ))}
        </View>

        <Text style={styles.section}>Origin</Text>
        <View style={styles.wrap}>
          {origins.map((origin) => (
            <Chip
              key={origin}
              label={origin}
              selected={draft.origins.includes(origin)}
              onPress={() => setDraft((prev) => ({ ...prev, origins: toggleValue(prev.origins, origin) }))}
            />
          ))}
        </View>

        <Text style={styles.section}>Certification</Text>
        <View style={styles.wrap}>
          {certifications.map((cert) => (
            <Chip
              key={cert}
              label={cert}
              selected={draft.certifications.includes(cert)}
              onPress={() =>
                setDraft((prev) => ({ ...prev, certifications: toggleValue(prev.certifications, cert) }))
              }
            />
          ))}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priceInputs: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceField: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  currency: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  priceInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.text,
  },
  to: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  footerBtn: { flex: 1 },
  footerBtnWide: { flex: 1.6 },
});
