import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, variant = 'solid', disabled = false, style }: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.solid,
        pressed && !disabled && { opacity: 0.88 },
        disabled && styles.disabled,
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
  disabled: {
    opacity: 0.45,
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
