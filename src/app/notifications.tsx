import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAccount } from '@/context/AccountContext';
import { formatINR } from '@/data/products';
import { useGoBack } from '@/hooks/useGoBack';
import { formatOrderDate, type Order, type OrderStatus } from '@/lib/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const statusNotice: Record<
  OrderStatus,
  { icon: keyof typeof Ionicons.glyphMap; title: (id: string) => string; body: (order: Order) => string }
> = {
  pending: {
    icon: 'time-outline',
    title: (id) => `Order #${id} placed`,
    body: (order) => `Payment of ${formatINR(order.total)} is pending. We'll call you to confirm.`,
  },
  confirmed: {
    icon: 'checkmark-circle-outline',
    title: (id) => `Order #${id} confirmed`,
    body: () => 'Your order is confirmed and will be packed soon.',
  },
  packed: {
    icon: 'cube-outline',
    title: (id) => `Order #${id} packed`,
    body: () => 'Your order is packed and ready to ship.',
  },
  shipped: {
    icon: 'airplane-outline',
    title: (id) => `Order #${id} shipped`,
    body: (order) =>
      order.trackingNumber
        ? `On its way${order.courier ? ` with ${order.courier}` : ''}. Tracking no. ${order.trackingNumber}.`
        : 'Your order is on its way.',
  },
  out_for_delivery: {
    icon: 'bicycle-outline',
    title: (id) => `Order #${id} out for delivery`,
    body: () => 'Your order will be delivered today.',
  },
  delivered: {
    icon: 'gift-outline',
    title: (id) => `Order #${id} delivered`,
    body: () => 'Thank you for shopping with us!',
  },
  cancelled: {
    icon: 'close-circle-outline',
    title: (id) => `Order #${id} cancelled`,
    body: () => 'This order was cancelled. Reach out to us if this was a mistake.',
  },
};

type Notice = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  meta: string | null;
  href: Href;
};

export default function NotificationsScreen() {
  const goBack = useGoBack('/');
  const { orders, refreshOrders } = useAccount();

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [refreshOrders]),
  );

  const notices = useMemo<Notice[]>(
    () =>
      [...orders]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((order) => {
          const notice = statusNotice[order.status];
          return {
            key: `order-${order.id}`,
            icon: notice.icon,
            title: notice.title(order.id),
            body: notice.body(order),
            meta: formatOrderDate(order.updatedAt),
            href: { pathname: '/order/[id]', params: { id: order.id } },
          };
        }),
    [orders],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title="Notifications" onBack={goBack} showCart />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notices.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={42} color={colors.primary} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>Order updates will appear here.</Text>
            <PrimaryButton label="Start Shopping" onPress={() => router.replace('/')} />
          </View>
        ) : null}
        {notices.map((notice) => (
          <Pressable
            key={notice.key}
            style={styles.card}
            onPress={() => router.push(notice.href)}
            accessibilityRole="button"
            accessibilityLabel={`${notice.title}. ${notice.body}`}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={notice.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title}>{notice.title}</Text>
              <Text style={styles.body}>{notice.body}</Text>
              {notice.meta ? <Text style={styles.meta}>{notice.meta}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  meta: {
    marginTop: 2,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl * 2,
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
    color: colors.textSecondary,
  },
});
