import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from '@/components/ProductImage';
import { useCatalog } from '@/context/CatalogContext';
import { formatINR, type Category } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const PREVIEW_COUNT = 3;
const THUMB = 28;

type Props = {
  category: Category;
};

export function CategoryCard({ category }: Props) {
  const { getProductsByCategory } = useCatalog();
  const items = getProductsByCategory(category.id);
  const count = items.length || category.count;
  const prices = items.map((item) => item.price).filter((price): price is number => price != null);
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const singlePrice = prices.length > 0 && prices.every((price) => price === fromPrice);
  const preview = count > 1 ? items.filter((item) => item.image != null).slice(0, PREVIEW_COUNT) : [];
  const more = count - preview.length;
  const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`;
  const priceLabel =
    fromPrice == null
      ? 'Price on request'
      : singlePrice && count === prices.length
        ? formatINR(fromPrice)
        : `From ${formatINR(fromPrice)}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/category/${category.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${countLabel}, ${priceLabel}`}
    >
      <View style={styles.cover}>
        <ProductImage source={category.image} style={styles.coverImage} />
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {category.name}
        </Text>
        <Text style={[styles.price, fromPrice == null && styles.priceMuted]} numberOfLines={1}>
          {priceLabel}
        </Text>

        <View style={styles.footer}>
          {preview.length ? (
            <View style={styles.thumbs}>
              {preview.map((item, index) => (
                <View key={item.id} style={[styles.thumb, index > 0 && styles.thumbOverlap]}>
                  <ProductImage source={item.image} style={styles.thumbImage} contentFit="cover" compact />
                </View>
              ))}
              {more > 0 ? (
                <View style={[styles.thumb, styles.thumbOverlap, styles.more]}>
                  <Text style={styles.moreText}>+{more}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.viewText}>{count === 1 ? 'View item' : `View all ${count}`}</Text>
          )}
          <View style={styles.go}>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  countBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  countText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: colors.surface,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  name: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  price: {
    marginTop: 2,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.primary,
  },
  priceMuted: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textMuted,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  thumbOverlap: {
    marginLeft: -spacing.sm,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  more: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: colors.primary,
  },
  viewText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  go: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
