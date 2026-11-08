import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, variant = 'solid', style }: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.solid,
        pressed && { opacity: 0.88 },
        style,
      ]}
    >
      <Text style={[styles.label, outline && styles.outlineLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  solid: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    letterSpacing: 0.4,
    color: colors.surface,
    textTransform: 'uppercase',
  },
  outlineLabel: {
    color: colors.primary,
  },
});
