import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AdminPage, Button, ConfirmButton, Loading, Notice, Panel, adminStyles } from '@/components/admin/ui';
import { Chip } from '@/components/Chip';
import { OrderStatusPill, PaymentStatusPill } from '@/components/OrderStatusPill';
import { ProductImage } from '@/components/ProductImage';
import { TextField } from '@/components/TextField';
import { useAdmin } from '@/context/AdminContext';
import { useCatalog } from '@/context/CatalogContext';
import { formatINR } from '@/data/products';
import { useAdminResource } from '@/hooks/useAdminResource';
import { deleteOrder, fetchOrder, updateOrder } from '@/lib/adminApi';
import { errorMessage } from '@/lib/api';
import { formatAddress, formatOrderDateTime } from '@/lib/orders';
import type { ApiOrder } from '@/shared/api';
import {
  ORDER_STATUSES,
  orderStatusLabel,
  PAYMENT_STATUSES,
  paymentStatusLabel,
  type OrderStatus,
  type PaymentStatus,
} from '@/shared/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Draft = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  courier: string;
  trackingNumber: string;
  adminNote: string;
};

const toDraft = (order: ApiOrder): Draft => ({
  status: order.status,
  paymentStatus: order.paymentStatus,
  courier: order.courier,
  trackingNumber: order.trackingNumber,
  adminNote: order.adminNote ?? '',
});

type Message = { tone: 'error' | 'success'; text: string } | null;

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id);
  const { data, setData, error, loading } = useAdminResource(`order-${orderId}`, (token) => fetchOrder(token, orderId));
  const [message, setMessage] = useState<Message>(null);
  const order = data?.order ?? null;

  if (!order) {
    return (
      <AdminPage title={`Order #${orderId}`}>
        {loading ? <Loading /> : <Notice tone="error" message={error ?? 'Order not found.'} />}
        <Button label="Back to orders" variant="outline" icon="arrow-back" onPress={() => router.replace('/admin/orders')} />
      </AdminPage>
    );
  }

  // Re-created after every save so the form starts from what the server stored.
  return (
    <OrderDetail
      key={order.updatedAt}
      order={order}
      message={message}
      onMessage={setMessage}
      onSaved={(saved) => setData({ order: saved })}
    />
  );
}

function OrderDetail({
  order,
  message,
  onMessage: setMessage,
  onSaved,
}: {
  order: ApiOrder;
  message: Message;
  onMessage: (message: Message) => void;
  onSaved: (order: ApiOrder) => void;
}) {
  const { run } = useAdmin();
  const { getProductById } = useCatalog();
  const [draft, setDraft] = useState(() => toDraft(order));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saved = toDraft(order);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== saved[key]);
  const units = order.lines.reduce((sum, line) => sum + line.qty, 0);
  const phoneDigits = order.address.phone.replace(/\D/g, '');

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await run((token) => updateOrder(token, order.id, draft));
      setMessage({ tone: 'success', text: 'Order updated. The customer sees the new status in the app.' });
      onSaved(result.order);
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      await run((token) => deleteOrder(token, order.id));
      router.replace('/admin/orders');
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
      setDeleting(false);
    }
  };

  return (
    <AdminPage
      title={`Order #${order.id}`}
      subtitle={`Placed ${formatOrderDateTime(order.createdAt)} · last updated ${formatOrderDateTime(order.updatedAt)}`}
      actions={<Button label="All orders" variant="ghost" icon="arrow-back" onPress={() => router.push('/admin/orders')} />}
    >
      <View style={adminStyles.row}>
        <OrderStatusPill status={order.status} />
        <PaymentStatusPill status={order.paymentStatus} />
        <Text style={adminStyles.muted}>
          {units} {units === 1 ? 'unit' : 'units'} · {formatINR(order.total)}
        </Text>
      </View>

      <View style={styles.columns}>
        <View style={styles.wide}>
          <Panel title="Items">
            {order.lines.map((line, index) => {
              const product = getProductById(line.productId);
              return (
                <View key={`${line.productId}-${index}`} style={styles.line}>
                  <ProductImage source={product?.image} style={styles.thumb} compact />
                  <View style={styles.lineMain}>
                    <Text style={adminStyles.text}>{line.name}</Text>
                    <Text style={adminStyles.muted}>
                      {line.sku ? `${line.sku} · ` : ''}
                      {line.qty} × {formatINR(line.price)}
                      {line.priceUnit ? `/${line.priceUnit}` : ''}
                      {product ? '' : ' · no longer in catalogue'}
                    </Text>
                  </View>
                  <Text style={adminStyles.strong}>{formatINR(line.price * line.qty)}</Text>
                </View>
              );
            })}
            <View style={adminStyles.divider} />
            <View style={styles.sumRow}>
              <Text style={adminStyles.text}>Item total</Text>
              <Text style={adminStyles.text}>{formatINR(order.subtotal)}</Text>
            </View>
            {order.discount > 0 ? (
              <View style={styles.sumRow}>
                <Text style={adminStyles.text}>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</Text>
                <Text style={adminStyles.text}>−{formatINR(order.discount)}</Text>
              </View>
            ) : null}
            <View style={styles.sumRow}>
              <Text style={adminStyles.strong}>Total</Text>
              <Text style={[adminStyles.strong, styles.total]}>{formatINR(order.total)}</Text>
            </View>
          </Panel>

          <Panel title="Update order">
            <Text style={adminStyles.label}>Order status</Text>
            <View style={adminStyles.row}>
              {ORDER_STATUSES.map((s) => (
                <Chip
                  key={s}
                  label={orderStatusLabel[s]}
                  selected={draft.status === s}
                  onPress={() => setDraft({ ...draft, status: s })}
                />
              ))}
            </View>
            <Text style={adminStyles.label}>Payment status</Text>
            <View style={adminStyles.row}>
              {PAYMENT_STATUSES.map((p) => (
                <Chip
                  key={p}
                  label={paymentStatusLabel[p]}
                  selected={draft.paymentStatus === p}
                  onPress={() => setDraft({ ...draft, paymentStatus: p })}
                />
              ))}
            </View>
            <View style={styles.fields}>
              <TextField
                label="Courier"
                optional
                value={draft.courier}
                onChangeText={(courier) => setDraft({ ...draft, courier })}
                placeholder="e.g. Delhivery, India Post"
                style={styles.field}
                maxLength={80}
              />
              <TextField
                label="Tracking number"
                optional
                value={draft.trackingNumber}
                onChangeText={(trackingNumber) => setDraft({ ...draft, trackingNumber })}
                placeholder="Shown to the customer"
                style={styles.field}
                maxLength={80}
              />
            </View>
            <TextField
              label="Internal note"
              optional
              value={draft.adminNote}
              onChangeText={(adminNote) => setDraft({ ...draft, adminNote })}
              placeholder="Only admins can see this"
              multiline
              maxLength={2000}
            />
            <Notice tone={message?.tone ?? 'success'} message={message?.text ?? null} />
            <View style={adminStyles.row}>
              <Button label="Save changes" icon="save-outline" onPress={save} busy={saving} disabled={!dirty} />
              {dirty ? <Button label="Discard" variant="ghost" onPress={() => setDraft(saved)} /> : null}
            </View>
          </Panel>
        </View>

        <View style={styles.narrow}>
          <Panel title="Customer">
            <Text style={adminStyles.strong}>{order.address.fullName}</Text>
            <Text style={adminStyles.text}>{formatAddress(order.address)}</Text>
            <Text style={adminStyles.text}>Mobile: {order.address.phone}</Text>
            {order.address.email ? <Text style={adminStyles.text}>{order.address.email}</Text> : null}
            <View style={adminStyles.row}>
              <Button
                label="Call"
                icon="call-outline"
                variant="outline"
                onPress={() => Linking.openURL(`tel:+91${phoneDigits}`)}
              />
              <Button
                label="WhatsApp"
                icon="logo-whatsapp"
                variant="outline"
                onPress={() =>
                  Linking.openURL(
                    `https://wa.me/91${phoneDigits}?text=${encodeURIComponent(
                      `Hello ${order.address.fullName}, this is RudraBeads about your order #${order.id}.`,
                    )}`,
                  )
                }
              />
            </View>
          </Panel>

          <Panel title="History">
            {[...order.events].reverse().map((event, index) => (
              <View key={`${event.at}-${index}`} style={styles.event}>
                <View style={[styles.dot, index === 0 && styles.dotLatest]} />
                <View style={styles.lineMain}>
                  <Text style={adminStyles.text}>{event.note}</Text>
                  <Text style={adminStyles.muted}>
                    {formatOrderDateTime(event.at)} · {event.actor}
                  </Text>
                </View>
              </View>
            ))}
          </Panel>

          <Panel title="Danger zone">
            <Text style={adminStyles.muted}>
              Deleting removes the order and its history permanently, and it disappears from analytics. Use
              “Cancelled” instead for real orders.
            </Text>
            <ConfirmButton
              label="Delete order"
              confirmLabel="Tap again to delete permanently"
              icon="trash-outline"
              busy={deleting}
              onConfirm={remove}
            />
          </Panel>
        </View>
      </View>
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, alignItems: 'flex-start' },
  wide: { flexGrow: 2, flexBasis: 480, gap: spacing.lg },
  narrow: { flexGrow: 1, flexBasis: 300, gap: spacing.lg },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 48, height: 48, borderRadius: radii.sm, backgroundColor: colors.surface },
  lineMain: { flex: 1, gap: 2 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  total: { color: colors.primary, fontSize: 16 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  field: { flexGrow: 1, flexBasis: 220, marginBottom: 0 },
  event: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: colors.border },
  dotLatest: { backgroundColor: colors.primary },
});
