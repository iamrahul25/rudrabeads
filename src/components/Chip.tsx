import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Shows a close icon; used for removable "active filter" pills. */
  removable?: boolean;
  accessibilityLabel?: string;
};

export function Chip({ label, selected = false, onPress, removable = false, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? (removable ? `Remove filter ${label}` : label)}
    >
      <Text style={[styles.text, selected && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
      {removable ? (
        <Ionicons name="close" size={14} color={selected ? colors.surface : colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.surface,
  },
});
