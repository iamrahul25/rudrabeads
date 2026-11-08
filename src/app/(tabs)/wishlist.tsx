import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { ProductCard } from '@/components/ProductCard';
import { products } from '@/data/products';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function WishlistScreen() {
  const wishlist = products.slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader title="Wishlist" showCart />
      <View style={styles.body}>
        <Text style={styles.subtitle}>{wishlist.length} saved items</Text>
        <View style={styles.grid}>
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, paddingHorizontal: spacing.lg },
  subtitle: {
    marginBottom: spacing.md,
    fontFamily: 'DMSans_400Regular',
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
