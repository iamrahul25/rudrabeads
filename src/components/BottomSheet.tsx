import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Mount only while open; unmounting closes it. */
export function BottomSheet({ title, onClose, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '88%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  body: {
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
