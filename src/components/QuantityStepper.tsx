import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { MAX_LINE_QTY } from '@/lib/cart';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  /** When provided, the minus button turns into a remove button at `min`. */
  onRemove?: () => void;
  size?: 'sm' | 'md';
  label?: string;
  style?: ViewStyle;
};

export function QuantityStepper({
  value,
  min = 1,
  max = MAX_LINE_QTY,
  onChange,
  onRemove,
  size = 'md',
  label = 'quantity',
  style,
}: Props) {
  const small = size === 'sm';
  const atMin = value <= min;
  const atMax = value >= max;
  const showRemove = atMin && onRemove != null;
  const decrementDisabled = atMin && !showRemove;
  const iconSize = small ? 14 : 16;

  return (
    <View style={[styles.wrap, small ? styles.wrapSm : styles.wrapMd, style]}>
      <Pressable
        onPress={() => (showRemove ? onRemove() : onChange(value - 1))}
        disabled={decrementDisabled}
        hitSlop={small ? 8 : 4}
        accessibilityRole="button"
        accessibilityLabel={showRemove ? 'Remove from cart' : `Decrease ${label}`}
        accessibilityState={{ disabled: decrementDisabled }}
        style={[styles.btn, small ? styles.btnSm : styles.btnMd, decrementDisabled && styles.disabled]}
      >
        <Ionicons
          name={showRemove ? 'trash-outline' : 'remove'}
          size={iconSize}
          color={small ? colors.surface : colors.text}
        />
      </Pressable>
      <Text
        style={[styles.value, small ? styles.valueSm : styles.valueMd]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${label} ${value}`}
      >
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={atMax}
        hitSlop={small ? 8 : 4}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        accessibilityState={{ disabled: atMax }}
        style={[styles.btn, small ? styles.btnSm : styles.btnMd, atMax && styles.disabled]}
      >
        <Ionicons name="add" size={iconSize} color={small ? colors.surface : colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapSm: {
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 2,
  },
  wrapMd: {
    gap: 12,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: {
    width: 26,
    height: 28,
  },
  btnMd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.35,
  },
  value: {
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
  },
  valueSm: {
    minWidth: 18,
    fontSize: 13,
    color: colors.surface,
  },
  valueMd: {
    minWidth: 28,
    fontSize: 16,
    color: colors.text,
  },
});
