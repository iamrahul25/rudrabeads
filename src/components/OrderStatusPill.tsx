import { StyleSheet, Text, View } from 'react-native';

import { orderStatusLabel, type OrderStatus } from '@/lib/orders';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const cancelled = status === 'cancelled';
  return (
    <View style={[styles.pill, cancelled ? styles.cancelled : styles.pending]}>
      <Text style={[styles.text, cancelled ? styles.cancelledText : styles.pendingText]}>
        {orderStatusLabel[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pending: { backgroundColor: colors.primaryMuted },
  cancelled: { backgroundColor: colors.border },
  text: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  pendingText: { color: colors.primary },
  cancelledText: { color: colors.textSecondary },
});
