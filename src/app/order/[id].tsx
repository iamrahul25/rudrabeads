import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { OrderStatusPill, PaymentStatusPill } from '@/components/OrderStatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductImage } from '@/components/ProductImage';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { useAccount } from '@/context/AccountContext';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';
import { formatINR } from '@/data/products';
import { useGoBack } from '@/hooks/useGoBack';
import { errorMessage } from '@/lib/api';
import { CUSTOMER_CANCELLABLE, formatAddress, formatOrderDate, formatOrderDateTime } from '@/lib/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string; placed?: string }>();
  const goBack = useGoBack('/orders');
  const { getOrder, cancelOrder, refreshOrders } = useAccount();
  const { getProductById } = useCatalog();
  const { addItem } = useCart();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const order = getOrder(String(params.id));

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [refreshOrders]),
  );

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader title="Order" onBack={goBack} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This order could not be found.</Text>
          <PrimaryButton label="My Orders" onPress={() => router.replace('/orders')} />
        </View>
      </SafeAreaView>
    );
  }

  const justPlaced = params.placed === '1';
  const cancellable = CUSTOMER_CANCELLABLE.includes(order.status);
  const shipping = [order.courier, order.trackingNumber && `Tracking no. ${order.trackingNumber}`]
    .filter(Boolean)
    .join(' · ');
  const timeline = [...order.events].reverse();

  const reorder = () => {
    order.lines.forEach((line) => addItem(line.productId, line.qty));
    router.push('/cart');
  };

  const onCancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(order.id);
    } catch (err) {
      setCancelError(errorMessage(err));
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title={`Order #${order.id}`} onBack={goBack} showCart />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {justPlaced ? (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            <Text style={styles.successTitle}>Order placed!</Text>
            <Text style={styles.successText}>
              We have received your order. Our team will call {order.address.phone} to confirm
              payment and dispatch.
            </Text>
          </View>
        ) : null}

        <View style={styles.statusRow}>
          <Text style={styles.date}>Placed on {formatOrderDate(order.createdAt)}</Text>
          <View style={styles.pills}>
            <OrderStatusPill status={order.status} />
            <PaymentStatusPill status={order.paymentStatus} />
          </View>
        </View>

        {shipping ? (
          <View style={[styles.card, styles.shipping]}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <Text style={styles.shippingText}>{shipping}</Text>
          </View>
        ) : null}

        <UnderlinedHeading style={styles.headingWrap} textStyle={styles.heading} lineWidth={28}>
          Items
        </UnderlinedHeading>
        <View style={styles.card}>
          {order.lines.map((line) => {
            const product = getProductById(line.productId);
            return (
              <Pressable
                key={line.productId}
                style={styles.line}
                onPress={() => product && router.push(`/product/${product.id}`)}
                disabled={!product}
                accessibilityRole="button"
              >
                {product ? (
                  <ProductImage source={product.image} style={styles.thumb} compact />
                ) : null}
                <View style={styles.lineMeta}>
                  <Text style={styles.lineName} numberOfLines={2}>
                    {line.name}
                  </Text>
                  <Text style={styles.lineQty}>
                    {line.qty} × {formatINR(line.price)}
                    {line.priceUnit ? `/${line.priceUnit}` : ''}
                  </Text>
                </View>
                <Text style={styles.lineTotal}>{formatINR(line.price * line.qty)}</Text>
              </Pressable>
            );
          })}
        </View>

        <UnderlinedHeading style={styles.headingWrap} textStyle={styles.heading} lineWidth={28}>
          Payment Summary
        </UnderlinedHeading>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Item total</Text>
            <Text style={styles.value}>{formatINR(order.subtotal)}</Text>
          </View>
          {order.discount > 0 ? (
            <View style={styles.row}>
              <Text style={styles.label}>Coupon ({order.couponCode})</Text>
              <Text style={[styles.value, { color: colors.success }]}>−{formatINR(order.discount)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Delivery</Text>
            <Text style={[styles.value, { color: colors.success }]}>FREE</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatINR(order.total)}</Text>
          </View>
        </View>

        <UnderlinedHeading style={styles.headingWrap} textStyle={styles.heading} lineWidth={28}>
          Delivery Address
        </UnderlinedHeading>
        <View style={styles.card}>
          <Text style={styles.addrName}>{order.address.fullName}</Text>
          <Text style={styles.addrText}>{formatAddress(order.address)}</Text>
          <Text style={styles.addrText}>Mobile: {order.address.phone}</Text>
          {order.address.email ? <Text style={styles.addrText}>{order.address.email}</Text> : null}
        </View>

        {timeline.length ? (
          <>
            <UnderlinedHeading style={styles.headingWrap} textStyle={styles.heading} lineWidth={28}>
              Order Updates
            </UnderlinedHeading>
            <View style={styles.card}>
              {timeline.map((event, index) => (
                <View key={`${event.at}-${index}`} style={styles.event}>
                  <View style={[styles.eventDot, index === 0 && styles.eventDotLatest]} />
                  <View style={styles.lineMeta}>
                    <Text style={styles.eventNote}>{event.note}</Text>
                    <Text style={styles.lineQty}>{formatOrderDateTime(event.at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Order Again" onPress={reorder} />
          {cancellable ? (
            <PrimaryButton
              label={cancelling ? 'Cancelling…' : confirmCancel ? 'Tap again to confirm cancel' : 'Cancel Order'}
              variant="outline"
              disabled={cancelling}
              onPress={onCancel}
            />
          ) : null}
          {cancelError ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {cancelError}
            </Text>
          ) : null}
          {justPlaced ? (
            <PrimaryButton label="Continue Shopping" variant="outline" onPress={() => router.dismissTo('/')} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  success: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: colors.text,
  },
  successText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    flexShrink: 1,
  },
  shipping: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingText: {
    flex: 1,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  event: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: colors.border,
  },
  eventDotLatest: {
    backgroundColor: colors.primary,
  },
  eventNote: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  error: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
  },
  headingWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  lineMeta: { flex: 1 },
  lineName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  lineQty: {
    marginTop: 2,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  lineTotal: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  totalRow: {
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
  addrName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  addrText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  missing: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  missingText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: colors.text,
  },
});
