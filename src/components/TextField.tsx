import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  optional?: boolean;
  style?: ViewStyle;
};

export function TextField({ label, error, optional, style, ...input }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...input}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  optional: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.danger,
  },
});
