import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/data/products';
import { useResponsive } from '@/hooks/useResponsive';
import { spacing } from '@/theme/spacing';

type Props = {
  products: Product[];
  style?: StyleProp<ViewStyle>;
};

const GAP = spacing.md;

export function ProductGrid({ products, style }: Props) {
  const { productColumns } = useResponsive();
  const rows: Product[][] = [];
  for (let index = 0; index < products.length; index += productColumns) {
    rows.push(products.slice(index, index + productColumns));
  }

  return (
    <View style={[styles.grid, style]}>
      {rows.map((row, rowIndex) => (
        <View key={row[0]?.id ?? rowIndex} style={styles.row}>
          {row.map((product) => (
            <View key={product.id} style={styles.cell}>
              <ProductCard product={product} />
            </View>
          ))}
          {Array.from({ length: productColumns - row.length }).map((_, spacerIndex) => (
            <View key={`spacer-${spacerIndex}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
});
