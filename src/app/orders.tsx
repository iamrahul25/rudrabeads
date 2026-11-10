import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { OrderStatusPill } from '@/components/OrderStatusPill';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAccount } from '@/context/AccountContext';
import { formatINR } from '@/data/products';
import { useGoBack } from '@/hooks/useGoBack';
import { formatOrderDate } from '@/lib/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function OrdersScreen() {
  const goBack = useGoBack('/(tabs)/account');
  const { orders, refreshOrders } = useAccount();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [refreshOrders]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader title="My Orders" onBack={goBack} showCart />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {orders.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={42} color={colors.primary} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Orders you place will appear here.</Text>
            <PrimaryButton label="Start Shopping" onPress={() => router.replace('/')} />
          </View>
        ) : null}
        {orders.map((order) => {
          const units = order.lines.reduce((sum, line) => sum + line.qty, 0);
          return (
            <Pressable
              key={order.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Order ${order.id}, ${formatINR(order.total)}`}
            >
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <OrderStatusPill status={order.status} />
              </View>
              <Text style={styles.items} numberOfLines={2}>
                {order.lines.map((line) => line.name).join(', ')}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.meta}>
                  {formatOrderDate(order.createdAt)} · {units} {units === 1 ? 'unit' : 'units'}
                </Text>
                <Text style={styles.total}>{formatINR(order.total)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  items: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  total: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.primary,
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
