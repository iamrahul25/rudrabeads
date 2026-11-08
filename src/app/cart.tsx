import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { formatINR, products } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type CartLine = {
  id: string;
  qty: number;
};

export default function CartScreen() {
  const [lines, setLines] = useState<CartLine[]>([
    { id: products[0]?.id ?? '5-mukhi-nepali-rudraksha', qty: 1 },
    { id: products[1]?.id ?? '7-mukhi-nepali-rudraksha', qty: 1 },
  ]);

  const items = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.id);
      return product ? { ...product, qty: line.qty } : null;
    })
    .filter(Boolean) as Array<(typeof products)[number] & { qty: number }>;

  const itemTotal = items.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0);
  const discount = 300;
  const delivery = 0;
  const payable = itemTotal - discount + delivery;

  const updateQty = (id: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((line) =>
          line.id === id ? { ...line, qty: Math.max(0, line.qty + delta) } : line,
        )
        .filter((line) => line.qty > 0),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title={`Your Cart (${items.length})`} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={item.image} style={styles.thumb} contentFit="cover" />
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.price}>{formatINR(item.price)}</Text>
              <View style={styles.qtyControls}>
                <Pressable style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                  <Ionicons name="remove" size={14} color={colors.text} />
                </Pressable>
                <Text style={styles.qty}>{item.qty}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                  <Ionicons name="add" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.coupon}>
          <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
          <TextInput
            placeholder="Apply Coupon"
            placeholderTextColor={colors.textMuted}
            style={styles.couponInput}
          />
          <Pressable accessibilityRole="button">
            <Text style={styles.apply}>APPLY</Text>
          </Pressable>
        </View>

        <View style={styles.summary}>
          <UnderlinedHeading
            style={styles.summaryTitleWrap}
            textStyle={styles.summaryTitle}
            lineWidth={28}
          >
            Price Details
          </UnderlinedHeading>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Item Price</Text>
            <Text style={styles.summaryValue}>{formatINR(itemTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              -{formatINR(discount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatINR(payable)}</Text>
          </View>
        </View>

        <View style={styles.secure}>
          <Ionicons name="lock-closed" size={14} color={colors.success} />
          <Text style={styles.secureText}>100% Secure Payments</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Proceed to Checkout" onPress={() => undefined} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
  },
  meta: { flex: 1, justifyContent: 'space-between' },
  name: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  price: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.primary,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  coupon: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  couponInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.text,
  },
  apply: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: colors.primary,
  },
  summary: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  summaryTitleWrap: {
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  totalValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.primary,
  },
  secure: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  secureText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.success,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
