import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductImage } from '@/components/ProductImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/data/products';
import { useGoBack } from '@/hooks/useGoBack';
import { minOrderQty } from '@/lib/cart';
import { couponsEnabled } from '@/lib/coupons';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function CartScreen() {
  const goBack = useGoBack('/');
  const {
    items,
    lineCount,
    subtotal,
    discount,
    total,
    coupon,
    couponCode,
    setQty,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const submitCoupon = () => {
    const result = applyCoupon(couponInput);
    if (!result.ok && !result.coupon) {
      setCouponError(result.message);
      return;
    }
    setCouponError(null);
    setCouponInput('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title={lineCount > 0 ? `Your Cart (${lineCount})` : 'Your Cart'} onBack={goBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bag-handle-outline" size={42} color={colors.primary} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Add rudraksha and malas from the shop to see them here.</Text>
            <PrimaryButton label="Continue Shopping" onPress={() => router.replace('/')} />
          </View>
        ) : null}

        {items.map((item) => {
          const moq = minOrderQty(item);
          return (
            <View key={item.id} style={styles.card}>
              <Pressable
                onPress={() => router.push(`/product/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`View ${item.name}`}
              >
                <ProductImage source={item.image} style={styles.thumb} compact />
              </Pressable>
              <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.price}>
                  {formatINR((item.price ?? 0) * item.qty)}
                  <Text style={styles.unitPrice}>
                    {'  '}
                    {formatINR(item.price)}
                    {item.priceUnit ? `/${item.priceUnit}` : ''}
                  </Text>
                </Text>
                {moq > 1 ? <Text style={styles.moq}>Minimum order {moq}</Text> : null}
                <View style={styles.qtyControls}>
                  <QuantityStepper
                    value={item.qty}
                    min={moq}
                    onChange={(next) => setQty(item.id, next)}
                    label={`${item.name} quantity`}
                    style={styles.stepper}
                  />
                  <Pressable
                    onPress={() => removeItem(item.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {items.length > 0 ? (
        <>
        {!couponsEnabled ? (
          <View
            style={[styles.coupon, styles.couponSoon]}
            accessible
            accessibilityLabel="Coupons and offers coming soon"
          >
            <Ionicons name="pricetag-outline" size={18} color={colors.textMuted} />
            <Text style={styles.couponSoonLabel}>Coupons & Offers</Text>
            <View style={styles.soonPill}>
              <Text style={styles.soonText}>Coming soon</Text>
            </View>
          </View>
        ) : couponCode ? (
          <View style={[styles.coupon, styles.couponApplied]}>
            <Ionicons
              name={coupon?.ok ? 'checkmark-circle' : 'alert-circle-outline'}
              size={18}
              color={coupon?.ok ? colors.success : colors.primary}
            />
            <View style={styles.couponMeta}>
              <Text style={styles.couponCode}>{couponCode}</Text>
              <Text style={styles.couponNote}>
                {coupon?.ok ? `You save ${formatINR(coupon.discount)}` : coupon?.message}
              </Text>
            </View>
            <Pressable onPress={removeCoupon} hitSlop={8} accessibilityRole="button">
              <Text style={styles.apply}>REMOVE</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.coupon}>
            <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
            <TextInput
              value={couponInput}
              onChangeText={(text) => {
                setCouponInput(text);
                setCouponError(null);
              }}
              onSubmitEditing={submitCoupon}
              placeholder="Apply Coupon"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel="Coupon code"
              style={styles.couponInput}
            />
            <Pressable
              onPress={submitCoupon}
              disabled={!couponInput.trim()}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={[styles.apply, !couponInput.trim() && styles.applyDisabled]}>APPLY</Text>
            </Pressable>
          </View>
        )}
        {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
        {couponsEnabled && !couponCode ? (
          <Pressable onPress={() => router.push('/info/offers')} accessibilityRole="link">
            <Text style={styles.viewOffers}>View available offers</Text>
          </Pressable>
        ) : null}

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
            <Text style={styles.summaryValue}>{formatINR(subtotal)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon ({couponCode})</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                −{formatINR(discount)}
              </Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatINR(total)}</Text>
          </View>
        </View>

        <View style={styles.secure}>
          <Ionicons name="lock-closed" size={14} color={colors.success} />
          <Text style={styles.secureText}>100% Secure Payments</Text>
        </View>
        </>
        ) : null}
      </ScrollView>

      {items.length > 0 ? (
        <View style={styles.footer}>
          <PrimaryButton
            label={`Proceed to Checkout · ${formatINR(total)}`}
            onPress={() => router.push('/checkout')}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
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
    backgroundColor: colors.surface,
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
  unitPrice: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  moq: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  qtyControls: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepper: {
    gap: spacing.sm,
  },
  removeBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplied: {
    borderColor: colors.success,
    paddingVertical: spacing.sm,
  },
  couponSoon: {
    backgroundColor: colors.background,
  },
  couponSoonLabel: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  soonPill: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  soonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
  couponMeta: { flex: 1 },
  couponCode: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.text,
  },
  couponNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  applyDisabled: {
    opacity: 0.4,
  },
  couponError: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.danger,
  },
  viewOffers: {
    marginTop: spacing.sm,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
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
