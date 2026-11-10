import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarChart, ShareList, StatCard, type BarDatum } from '@/components/admin/charts';
import { AdminPage, Button, Loading, Notice, Panel, adminStyles } from '@/components/admin/ui';
import { Chip } from '@/components/Chip';
import { OrderStatusPill } from '@/components/OrderStatusPill';
import { formatINR } from '@/data/products';
import { useAdminResource } from '@/hooks/useAdminResource';
import { fetchAnalytics, fetchOrders } from '@/lib/adminApi';
import { formatOrderDateTime } from '@/lib/orders';
import type { ApiAnalytics } from '@/shared/api';
import { ORDER_STATUSES, orderStatusLabel, PAYMENT_STATUSES, paymentStatusLabel } from '@/shared/orders';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const ranges = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '12 months' },
  { days: 0, label: 'All time' },
];

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const istDay = (ms: number) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);

function chartData(analytics: ApiAnalytics): BarDatum[] {
  const byBucket = new Map(analytics.series.map((point) => [point.bucket, point]));
  let buckets = analytics.series.map((point) => point.bucket);
  if (analytics.bucket === 'day') {
    const today = Date.now();
    buckets = Array.from({ length: analytics.rangeDays }, (_, i) => istDay(today - (analytics.rangeDays - 1 - i) * DAY_MS));
  }
  return buckets.map((bucket) => {
    const point = byBucket.get(bucket);
    const date = new Date(`${bucket.length === 7 ? `${bucket}-01` : bucket}T00:00:00Z`);
    const label = date.toLocaleDateString('en-IN', analytics.bucket === 'day'
      ? { day: 'numeric', month: 'short', timeZone: 'UTC' }
      : { month: 'short', year: '2-digit', timeZone: 'UTC' });
    const orders = point?.orders ?? 0;
    return {
      key: bucket,
      label,
      value: point?.orderValue ?? 0,
      detail: `${formatINR(point?.orderValue ?? 0)} · ${orders} ${orders === 1 ? 'order' : 'orders'}`,
    };
  });
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const analytics = useAdminResource(`analytics-${days}`, (token) => fetchAnalytics(token, days));
  const recent = useAdminResource('recent-orders', (token) => fetchOrders(token, { limit: 6 }));
  const data = analytics.data;
  const series = useMemo(() => (data ? chartData(data) : []), [data]);

  const reloadAll = () => Promise.all([analytics.reload(), recent.reload()]);

  return (
    <AdminPage
      title="Dashboard"
      subtitle="Sales and order activity across all customers"
      onRefresh={reloadAll}
      actions={<Button label="Refresh" icon="refresh" variant="outline" onPress={reloadAll} busy={analytics.loading} />}
    >
      <View style={adminStyles.row}>
        {ranges.map((range) => (
          <Chip key={range.days} label={range.label} selected={days === range.days} onPress={() => setDays(range.days)} />
        ))}
      </View>

      <Notice tone="error" message={analytics.error} />

      {!data ? (
        analytics.loading ? <Loading /> : null
      ) : (
        <>
          {data.needsAttention.pending > 0 || data.needsAttention.paymentPending > 0 ? (
            <Pressable onPress={() => router.push({ pathname: '/admin/orders', params: { status: 'pending' } })}>
              <Notice
                tone="info"
                message={`${data.needsAttention.pending} new ${data.needsAttention.pending === 1 ? 'order needs' : 'orders need'} confirmation · ${data.needsAttention.paymentPending} active ${data.needsAttention.paymentPending === 1 ? 'order is' : 'orders are'} awaiting payment. Tap to view pending orders.`}
              />
            </Pressable>
          ) : null}

          <View style={styles.stats}>
            <StatCard
              label="Order value"
              value={formatINR(data.totals.orderValue)}
              hint="Excludes cancelled orders"
            />
            <StatCard label="Collected" value={formatINR(data.totals.collected)} hint="Orders marked paid" />
            <StatCard
              label="Orders"
              value={String(data.totals.orders)}
              hint={`${data.totals.cancelled} cancelled`}
            />
            <StatCard label="Avg. order" value={formatINR(data.totals.averageOrderValue)} />
            <StatCard label="Customers" value={String(data.totals.customers)} hint="Unique phone numbers" />
            <StatCard label="Units sold" value={String(data.totals.units)} />
          </View>

          <Panel title={data.bucket === 'day' ? 'Daily order value' : 'Monthly order value'}>
            {series.length ? <BarChart data={series} /> : <Text style={adminStyles.muted}>No orders in this period.</Text>}
          </Panel>

          <View style={styles.columns}>
            <Panel title="Orders by status" style={styles.column}>
              <ShareList
                empty="No orders in this period."
                data={ORDER_STATUSES.filter((s) => data.byStatus[s]).map((s) => ({
                  key: s,
                  label: orderStatusLabel[s],
                  value: data.byStatus[s] ?? 0,
                  color: s === 'cancelled' ? colors.textMuted : s === 'delivered' ? colors.success : colors.primarySoft,
                }))}
              />
            </Panel>
            <Panel title="Payments" style={styles.column}>
              <ShareList
                empty="No orders in this period."
                data={PAYMENT_STATUSES.filter((s) => data.byPayment[s]).map((s) => ({
                  key: s,
                  label: paymentStatusLabel[s],
                  value: data.byPayment[s] ?? 0,
                  color: s === 'paid' ? colors.success : s === 'refunded' ? colors.textMuted : colors.warning,
                }))}
              />
            </Panel>
          </View>

          <View style={styles.columns}>
            <Panel title="Top products" style={styles.column}>
              <ShareList
                empty="No sales in this period."
                data={data.topProducts.map((p) => ({
                  key: p.productId,
                  label: p.name,
                  value: p.revenue,
                  detail: `${formatINR(p.revenue)} · ${p.units} units`,
                }))}
              />
            </Panel>
            <Panel title="Sales by category" style={styles.column}>
              <ShareList
                empty="No sales in this period."
                data={data.byCategory.map((c) => ({
                  key: c.categoryId ?? 'deleted',
                  label: c.name,
                  value: c.revenue,
                  detail: `${formatINR(c.revenue)} · ${c.units} units`,
                }))}
              />
            </Panel>
          </View>

          <Panel title="Catalogue">
            <View style={adminStyles.row}>
              <Text style={adminStyles.text}>{data.catalog.products} products</Text>
              <Text style={adminStyles.muted}>·</Text>
              <Text style={adminStyles.text}>{data.catalog.categories} categories</Text>
              <Text style={adminStyles.muted}>·</Text>
              <Text style={adminStyles.text}>{data.catalog.outOfStock} out of stock</Text>
              <Text style={adminStyles.muted}>·</Text>
              <Text style={adminStyles.text}>{data.catalog.priceOnRequest} price on request</Text>
            </View>
          </Panel>
        </>
      )}

      <Panel
        title="Latest orders"
        right={<Button label="All orders" variant="ghost" icon="arrow-forward" onPress={() => router.push('/admin/orders')} />}
      >
        <Notice tone="error" message={recent.error} />
        {recent.data?.orders.length === 0 ? <Text style={adminStyles.muted}>No orders yet.</Text> : null}
        {recent.data?.orders.map((order) => (
          <Pressable
            key={order.id}
            style={styles.recent}
            onPress={() => router.push({ pathname: '/admin/orders/[id]', params: { id: order.id } })}
            accessibilityRole="button"
          >
            <View style={styles.recentMain}>
              <Text style={adminStyles.strong}>#{order.id}</Text>
              <Text style={adminStyles.muted} numberOfLines={1}>
                {order.customerName} · {formatOrderDateTime(order.createdAt)}
              </Text>
            </View>
            <OrderStatusPill status={order.status} />
            <Text style={[adminStyles.strong, styles.recentTotal]}>{formatINR(order.total)}</Text>
          </Pressable>
        ))}
      </Panel>
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  column: { flexGrow: 1, flexBasis: 320 },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  recentMain: { flex: 1, gap: 2 },
  recentTotal: { minWidth: 80, textAlign: 'right' },
});
