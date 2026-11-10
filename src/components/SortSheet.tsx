import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { sortOptions, type SortKey } from '@/lib/search';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  value: SortKey;
  onChange: (value: SortKey) => void;
  onClose: () => void;
};

export function SortSheet({ value, onChange, onClose }: Props) {
  return (
    <BottomSheet title="Sort by" onClose={onClose}>
      <View style={styles.list}>
        {sortOptions.map((option) => {
          const selected = option.key === value;
          return (
            <Pressable
              key={option.key}
              style={styles.row}
              onPress={() => onChange(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.label, selected && styles.labelActive]}>{option.label}</Text>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selected ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: colors.text,
  },
  labelActive: {
    fontFamily: 'DMSans_700Bold',
    color: colors.primary,
  },
});
