import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel = 'See All', onAction }: Props) {
  return (
    <View style={styles.row}>
      <UnderlinedHeading textStyle={styles.title} lineWidth={32}>
        {title}
      </UnderlinedHeading>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: colors.text,
  },
  action: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
});
