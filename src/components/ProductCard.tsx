import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatINR, Product } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  product: Product;
  width?: number | `${number}%`;
};

export function ProductCard({ product, width = '48%' }: Props) {
  return (
    <View style={[styles.card, { width }]}>
      <Pressable
        onPress={() => router.push(`/product/${product.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatINR(product.price)}`}
      >
        <View style={styles.imageWrap}>
          <Image source={product.image} style={styles.image} contentFit="cover" />
          <View style={styles.wish}>
            <Ionicons name="heart-outline" size={16} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
      </Pressable>
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.price}>{formatINR(product.price)}</Text>
          <Text style={styles.original}>{formatINR(product.originalPrice)}</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Add to cart"
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="add" size={18} color={colors.surface} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrap: {
    height: 140,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wish: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: spacing.sm,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.text,
    minHeight: 36,
  },
  priceRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  original: {
    marginTop: 2,
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
