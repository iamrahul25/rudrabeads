import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCart } from '@/context/CartContext';
import { formatINR, Product } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  product: Product;
  width?: number | `${number}%`;
};

export function ProductCard({ product, width = '48%' }: Props) {
  const { addItem, lines } = useCart();
  const inCart = lines.find((line) => line.id === product.id)?.qty ?? 0;

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
          {product.originalPrice != null ? (
            <Text style={styles.original}>{formatINR(product.originalPrice)}</Text>
          ) : product.priceUnit ? (
            <Text style={styles.unit}>/{product.priceUnit}</Text>
          ) : null}
        </View>
        <Pressable
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel={inCart > 0 ? `${inCart} in cart. Add another` : 'Add to cart'}
          onPress={() => addItem(product.id, 1)}
        >
          {inCart > 0 ? (
            <Text style={styles.addQty}>{inCart}</Text>
          ) : (
            <Ionicons name="add" size={18} color={colors.surface} />
          )}
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
  unit: {
    marginTop: 2,
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addQty: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.surface,
  },
});
