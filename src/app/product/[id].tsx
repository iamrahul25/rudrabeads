import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { formatINR, getProductById } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const trustItems = [
  { icon: 'flask-outline' as const, label: 'Lab Tested' },
  { icon: 'leaf-outline' as const, label: 'Natural' },
  { icon: 'diamond-outline' as const, label: 'Pure' },
  { icon: 'refresh-outline' as const, label: 'Easy Returns' },
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getProductById(String(id));
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Product not found</Text>
        <PrimaryButton label="Go Home" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/cart')}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Cart"
        >
          <Ionicons name="bag-handle-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image source={product.image} style={styles.hero} contentFit="cover" />

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.star} />
            <Text style={styles.rating}>
              {product.rating} · {product.reviews} reviews
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(product.price)}</Text>
            <Text style={styles.original}>{formatINR(product.originalPrice)}</Text>
            <View style={styles.discount}>
              <Text style={styles.discountText}>
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}
                % OFF
              </Text>
            </View>
          </View>

          <View style={styles.trustRow}>
            {trustItems.map((item) => (
              <View key={item.label} style={styles.trustItem}>
                <View style={styles.trustIcon}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.trustLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Benefits</Text>
          {product.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyControls}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={16} color={colors.text} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQty((q) => q + 1)}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Add to Cart"
          variant="outline"
          style={styles.footerBtn}
          onPress={() => router.push('/cart')}
        />
        <PrimaryButton
          label="Buy Now"
          style={styles.footerBtn}
          onPress={() => router.push('/cart')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: spacing.xl },
  hero: {
    marginHorizontal: spacing.lg,
    height: 280,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  name: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 30,
    color: colors.text,
  },
  ratingRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: colors.primary,
  },
  original: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discount: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  discountText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
  trustRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: { alignItems: 'center', width: '23%' },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  benefitText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  qtyRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerBtn: { flex: 1 },
  missing: {
    margin: spacing.xl,
    fontFamily: 'DMSans_500Medium',
    color: colors.text,
  },
});
