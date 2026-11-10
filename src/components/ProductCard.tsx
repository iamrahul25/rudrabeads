import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from '@/components/ProductImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatINR, Product } from '@/data/products';
import { isPurchasable, minOrderQty } from '@/lib/cart';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const { addItem, setQty, removeItem, getQty } = useCart();
  const wishlist = useWishlist();
  const inCart = getQty(product.id);
  const saved = wishlist.has(product.id);
  const purchasable = isPurchasable(product);
  const moq = minOrderQty(product);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(`/product/${product.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatINR(product.price)}`}
      >
        <View style={styles.imageWrap}>
          <ProductImage source={product.image} style={styles.image} />
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
      </Pressable>
      <Pressable
        style={styles.wish}
        onPress={() => wishlist.toggle(product.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ selected: saved }}
        accessibilityLabel={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      >
        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={colors.primary} />
      </Pressable>
      <View style={styles.priceRow}>
        <View style={styles.priceCol}>
          <Text style={styles.price} numberOfLines={1}>
            {purchasable ? formatINR(product.price) : 'On request'}
          </Text>
          {moq > 1 ? (
            <Text style={styles.unit} numberOfLines={1}>
              Min. {moq}
            </Text>
          ) : product.priceUnit && purchasable ? (
            <Text style={styles.unit}>/{product.priceUnit}</Text>
          ) : null}
        </View>
        {!purchasable ? null : inCart > 0 ? (
          <QuantityStepper
            size="sm"
            value={inCart}
            min={moq}
            onChange={(next) => setQty(product.id, next)}
            onRemove={() => removeItem(product.id)}
            label={`${product.name} quantity`}
          />
        ) : (
          <Pressable
            style={styles.addBtn}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            onPress={() => addItem(product.id, moq)}
          >
            <Ionicons name="add" size={18} color={colors.surface} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wish: {
    position: 'absolute',
    top: spacing.sm + 8,
    right: spacing.sm + 8,
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
    gap: spacing.xs,
  },
  priceCol: {
    flexShrink: 1,
  },
  price: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: colors.primary,
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
});
