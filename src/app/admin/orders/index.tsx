import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminPage, Button, Empty, Loading, Notice, Panel, adminStyles } from '@/components/admin/ui';
import { Chip } from '@/components/Chip';
import { OrderStatusPill, PaymentStatusPill } from '@/components/OrderStatusPill';
import { formatINR } from '@/data/products';
import { useAdminResource } from '@/hooks/useAdminResource';
import { fetchOrders } from '@/lib/adminApi';
import { formatOrderDateTime } from '@/lib/orders';
import {
  isOrderStatus,
  ORDER_STATUSES,
  orderStatusLabel,
  PAYMENT_STATUSES,
  paymentStatusLabel,
  type OrderStatus,
  type PaymentStatus,
} from '@/shared/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const PAGE_SIZE = 25;

export default function AdminOrders() {
  const params = useLocalSearchParams<{ status?: string }>();
  const [status, setStatus] = useState<OrderStatus | undefined>(
    isOrderStatus(params.status) ? params.status : undefined,
  );
  const [payment, setPayment] = useState<PaymentStatus | undefined>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, error, loading, reload } = useAdminResource(
    `orders-${status}-${payment}-${query}-${page}`,
    (token) =>
      fetchOrders(token, { status, paymentStatus: payment, q: query, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
  );

  const counts = data?.statusCounts ?? {};
  const allCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const pickStatus = (next: OrderStatus | undefined) => {
    setStatus(next);
    setPage(0);
  };

  return (
    <AdminPage
      title="Orders"
      subtitle="Every order placed in the app, newest first"
      onRefresh={reload}
      actions={<Button label="Refresh" icon="refresh" variant="outline" onPress={reload} busy={loading} />}
    >
      <Panel>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by order ID, customer name, phone or email"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Search orders"
            autoCorrect={false}
          />
        </View>
        <View style={adminStyles.row}>
          <Chip label={`All (${allCount})`} selected={!status} onPress={() => pickStatus(undefined)} />
          {ORDER_STATUSES.map((s) => (
            <Chip
              key={s}
              label={`${orderStatusLabel[s]} (${counts[s] ?? 0})`}
              selected={status === s}
              onPress={() => pickStatus(status === s ? undefined : s)}
            />
          ))}
        </View>
        <View style={adminStyles.row}>
          <Text style={adminStyles.label}>Payment:</Text>
          <Chip label="Any" selected={!payment} onPress={() => { setPayment(undefined); setPage(0); }} />
          {PAYMENT_STATUSES.map((p) => (
            <Chip
              key={p}
              label={paymentStatusLabel[p]}
              selected={payment === p}
              onPress={() => {
                setPayment(payment === p ? undefined : p);
                setPage(0);
              }}
            />
          ))}
        </View>
      </Panel>

      <Notice tone="error" message={error} />

      <Panel
        title={data ? `${data.total} ${data.total === 1 ? 'order' : 'orders'}` : 'Orders'}
        right={
          data && pages > 1 ? (
            <View style={adminStyles.row}>
              <Button label="Previous" variant="ghost" icon="chevron-back" disabled={page === 0} onPress={() => setPage(page - 1)} />
              <Text style={adminStyles.muted}>
                Page {page + 1} of {pages}
              </Text>
              <Button label="Next" variant="ghost" icon="chevron-forward" disabled={page + 1 >= pages} onPress={() => setPage(page + 1)} />
            </View>
          ) : null
        }
      >
        {!data && loading ? <Loading /> : null}
        {data && data.orders.length === 0 ? <Empty icon="receipt-outline" message="No orders match these filters." /> : null}
        {data?.orders.map((order) => (
          <Pressable
            key={order.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push({ pathname: '/admin/orders/[id]', params: { id: order.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Order ${order.id} from ${order.customerName}, ${formatINR(order.total)}`}
          >
            <View style={styles.main}>
              <View style={adminStyles.row}>
                <Text style={adminStyles.strong}>#{order.id}</Text>
                <OrderStatusPill status={order.status} />
                <PaymentStatusPill status={order.paymentStatus} />
              </View>
              <Text style={adminStyles.text} numberOfLines={1}>
                {order.customerName} · {order.phone} · {order.city}, {order.state}
              </Text>
              <Text style={adminStyles.muted} numberOfLines={1}>
                {order.units} {order.units === 1 ? 'unit' : 'units'} · {order.itemNames}
              </Text>
            </View>
            <View style={styles.side}>
              <Text style={styles.total}>{formatINR(order.total)}</Text>
              <Text style={adminStyles.muted}>{formatOrderDateTime(order.createdAt)}</Text>
            </View>
          </Pressable>
        ))}
      </Panel>
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.text, paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  main: { flex: 1, gap: 4 },
  side: { alignItems: 'flex-end', gap: 4 },
  total: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: colors.primary },
});
