import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductGrid } from '@/components/ProductGrid';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { isPurchasable, minOrderQty } from '@/lib/cart';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function WishlistScreen() {
  const { items, clear } = useWishlist();
  const { addItem, getQty } = useCart();
  const addable = items.filter((item) => isPurchasable(item) && getQty(item.id) === 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader title="Wishlist" showCart />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={42} color={colors.primary} />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyText}>
            Tap the heart on any product to save it here for later.
          </Text>
          <PrimaryButton label="Explore Products" onPress={() => router.push('/(tabs)/search')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.toolbar}>
            <Text style={styles.subtitle}>
              {items.length} saved {items.length === 1 ? 'item' : 'items'}
            </Text>
            <Pressable onPress={clear} hitSlop={8} accessibilityRole="button">
              <Text style={styles.clear}>Clear all</Text>
            </Pressable>
          </View>
          <ProductGrid products={items} style={styles.grid} />
          {addable.length > 0 ? (
            <PrimaryButton
              label={`Add ${addable.length === items.length ? 'all' : addable.length} to cart`}
              variant="outline"
              onPress={() => addable.forEach((item) => addItem(item.id, minOrderQty(item)))}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textSecondary,
  },
  clear: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  grid: {
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: colors.text,
  },
  emptyText: {
    marginBottom: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
