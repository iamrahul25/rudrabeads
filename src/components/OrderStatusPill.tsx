import { StyleSheet, Text, View } from 'react-native';

import {
  orderStatusLabel,
  paymentStatusLabel,
  type OrderStatus,
  type PaymentStatus,
} from '@/lib/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Tone = { bg: string; fg: string };

const tones = {
  new: { bg: colors.primaryMuted, fg: colors.primary },
  progress: { bg: colors.warningSoft, fg: colors.warning },
  done: { bg: colors.successSoft, fg: colors.success },
  muted: { bg: colors.border, fg: colors.textSecondary },
} satisfies Record<string, Tone>;

const statusTone: Record<OrderStatus, Tone> = {
  pending: tones.new,
  confirmed: tones.progress,
  packed: tones.progress,
  shipped: tones.progress,
  out_for_delivery: tones.progress,
  delivered: tones.done,
  cancelled: tones.muted,
};

const paymentTone: Record<PaymentStatus, Tone> = {
  pending: tones.progress,
  paid: tones.done,
  refunded: tones.muted,
};

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <Pill label={orderStatusLabel[status]} tone={statusTone[status]} />;
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return <Pill label={paymentStatusLabel[status]} tone={paymentTone[status]} />;
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
});
