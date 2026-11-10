import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressForm } from '@/components/AddressForm';
import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { useAccount } from '@/context/AccountContext';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/data/products';
import { useGoBack } from '@/hooks/useGoBack';
import { emptyAddress, normalizePhone, validateAddress, type AddressErrors } from '@/lib/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function CheckoutScreen() {
  const goBack = useGoBack('/cart');
  const { items, subtotal, discount, total, couponCode, coupon, clear } = useCart();
  const { address: savedAddress, profile, placeOrder } = useAccount();
  const [address, setAddress] = useState(
    () =>
      savedAddress ?? {
        ...emptyAddress,
        fullName: profile.name,
        phone: profile.phone,
        email: profile.email,
      },
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return <View style={styles.safe} />;
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader title="Checkout" onBack={goBack} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
          <PrimaryButton label="Continue Shopping" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const submit = () => {
    const nextErrors = validateAddress(address);
    setErrors(nextErrors);
    setSubmitted(true);
    if (Object.keys(nextErrors).length) return;

    const cleanAddress = {
      ...address,
      phone: normalizePhone(address.phone),
      pincode: address.pincode.trim(),
    };
    const order = placeOrder({
      lines: items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price ?? 0,
        priceUnit: item.priceUnit,
        qty: item.qty,
      })),
      subtotal,
      discount,
      total,
      couponCode: coupon?.ok ? couponCode : null,
      address: cleanAddress,
    });
    setPlaced(true);
    clear();
    router.dismissTo('/');
    router.push({ pathname: '/order/[id]', params: { id: order.id, placed: '1' } });
  };

  const errorCount = Object.keys(errors).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title="Checkout" onBack={goBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <UnderlinedHeading style={styles.headingWrap} textStyle={styles.heading} lineWidth={28}>
            Delivery Address
          </UnderlinedHeading>
          <AddressForm
            value={address}
            errors={submitted ? errors : {}}
            onChange={(next) => {
              setAddress(next);
              if (submitted) setErrors(validateAddress(next));
            }}
          />

          <UnderlinedHeading style={styles.headingWrap} textStyle={styles.heading} lineWidth={28}>
            Order Summary
          </UnderlinedHeading>
          <View style={styles.card}>
            {items.map((item) => (
              <View key={item.id} style={styles.line}>
                <Text style={styles.lineName} numberOfLines={2}>
                  {item.name} <Text style={styles.lineQty}>× {item.qty}</Text>
                </Text>
                <Text style={styles.lineValue}>{formatINR((item.price ?? 0) * item.qty)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.line}>
              <Text style={styles.label}>Item total</Text>
              <Text style={styles.value}>{formatINR(subtotal)}</Text>
            </View>
            {discount > 0 ? (
              <View style={styles.line}>
                <Text style={styles.label}>Coupon ({couponCode})</Text>
                <Text style={[styles.value, { color: colors.success }]}>−{formatINR(discount)}</Text>
              </View>
            ) : null}
            <View style={styles.line}>
              <Text style={styles.label}>Delivery</Text>
              <Text style={[styles.value, { color: colors.success }]}>FREE</Text>
            </View>
            <View style={[styles.line, styles.totalLine]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatINR(total)}</Text>
            </View>
          </View>

          <UnderlinedHeading style={styles.headingWrap} textStyle={styles.heading} lineWidth={28}>
            Payment
          </UnderlinedHeading>
          <View style={[styles.card, styles.paymentNote]}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.paymentText}>
              Online payment is coming soon. Your order will be saved as “Payment pending” and our
              team will contact you to confirm payment and delivery.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {submitted && errorCount > 0 ? (
          <Text style={styles.footerError}>Please fix the highlighted fields above.</Text>
        ) : null}
        <PrimaryButton label={`Place Order · ${formatINR(total)}`} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headingWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  lineName: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  lineQty: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
  },
  lineValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  label: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  totalLine: {
    marginTop: spacing.xs,
    marginBottom: 0,
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
  paymentNote: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  paymentText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  footerError: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
  },
  empty: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emptyText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: colors.text,
  },
});
