import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export const ADMIN_MAX_WIDTH = 1120;

type PageProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  onRefresh?: () => Promise<unknown>;
};

export function AdminPage({ title, subtitle, actions, children, onRefresh }: PageProps) {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await onRefresh().catch(() => undefined);
              setRefreshing(false);
            }}
          />
        ) : undefined
      }
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {actions ? <View style={styles.headerActions}>{actions}</View> : null}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

export function Panel({
  title,
  right,
  children,
  style,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.panel, style]}>
      {title || right ? (
        <View style={styles.panelHeader}>
          {title ? <Text style={styles.panelTitle}>{title}</Text> : <View />}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const buttonColors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.surface, border: colors.primary },
  outline: { bg: colors.surface, fg: colors.primary, border: colors.primary },
  danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
};

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  busy = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const palette = buttonColors[variant];
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={palette.fg} />
      ) : null}
      <Text style={[styles.buttonLabel, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Asks for a second tap before running a destructive action. */
export function ConfirmButton({
  label,
  confirmLabel = 'Tap again to confirm',
  onConfirm,
  ...rest
}: Omit<ButtonProps, 'onPress' | 'variant'> & { confirmLabel?: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  return (
    <Button
      {...rest}
      variant="danger"
      label={armed ? confirmLabel : label}
      onPress={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    />
  );
}

export function Notice({ tone, message }: { tone: 'error' | 'success' | 'info'; message: string | null }) {
  if (!message) return null;
  const palette =
    tone === 'error'
      ? { bg: '#FBE9E7', fg: colors.danger, icon: 'alert-circle-outline' as const }
      : tone === 'success'
        ? { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle-outline' as const }
        : { bg: colors.warningSoft, fg: colors.warning, icon: 'information-circle-outline' as const };
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }]} accessibilityLiveRegion="polite">
      <Ionicons name={palette.icon} size={18} color={palette.fg} />
      <Text style={[styles.noticeText, { color: palette.fg }]}>{message}</Text>
    </View>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function Empty({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View style={styles.loading}>
      <Ionicons name={icon} size={32} color={colors.textMuted} />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export function Badge({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'warning' | 'success' | 'danger' }) {
  const palette = {
    muted: { bg: colors.border, fg: colors.textSecondary },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: '#FBE9E7', fg: colors.danger },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export const adminStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  label: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text },
  text: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.text },
  muted: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
  strong: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  inner: { width: '100%', maxWidth: ADMIN_MAX_WIDTH, alignSelf: 'center', gap: spacing.lg },
  header: {
    paddingTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerText: { flexShrink: 1, gap: 2 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.text },
  subtitle: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textSecondary },
  headerActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  panelTitle: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: colors.text },
  button: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  buttonLabel: { fontFamily: 'DMSans_700Bold', fontSize: 13 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  noticeText: { flex: 1, fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 19 },
  loading: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm },
  muted: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  badge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11 },
});
