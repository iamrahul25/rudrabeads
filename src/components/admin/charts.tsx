import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export type BarDatum = { key: string; label: string; value: number; detail: string };

/** Vertical bars; tapping a bar shows its detail line above the chart. */
export function BarChart({ data, height = 160 }: { data: BarDatum[]; height?: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const active = data.find((d) => d.key === selected) ?? data[data.length - 1];
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <View style={styles.chart}>
      <Text style={styles.chartDetail}>{active ? `${active.label}: ${active.detail}` : ' '}</Text>
      <View style={[styles.bars, { height }]}>
        {data.map((d) => (
          <Pressable
            key={d.key}
            style={styles.barSlot}
            onPress={() => setSelected(d.key)}
            onHoverIn={() => setSelected(d.key)}
            accessibilityRole="button"
            accessibilityLabel={`${d.label}: ${d.detail}`}
          >
            <View
              style={[
                styles.bar,
                { height: `${Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)}%` },
                active?.key === d.key && styles.barActive,
              ]}
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.axis}>
        {data.map((d, index) => (
          <Text key={d.key} style={styles.axisLabel} numberOfLines={1}>
            {index % labelEvery === 0 ? d.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

export type ShareDatum = { key: string; label: string; value: number; detail?: string; color?: string };

/** Horizontal bars sized relative to the largest value. */
export function ShareList({ data, empty }: { data: ShareDatum[]; empty: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <Text style={styles.statHint}>{empty}</Text>;
  return (
    <View style={styles.shares}>
      {data.map((d) => (
        <View key={d.key} style={styles.share}>
          <View style={styles.shareTop}>
            <Text style={styles.shareLabel} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={styles.shareValue}>{d.detail ?? d.value}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? colors.primarySoft },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 4,
  },
  statLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  statValue: { fontFamily: 'DMSans_700Bold', fontSize: 24, color: colors.text },
  statHint: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textSecondary },
  chart: { gap: spacing.sm },
  chartDetail: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.text },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.primaryMuted, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barActive: { backgroundColor: colors.primary },
  axis: { flexDirection: 'row', gap: 2 },
  axisLabel: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.textMuted, overflow: 'visible' },
  shares: { gap: spacing.md },
  share: { gap: 6 },
  shareTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  shareLabel: { flex: 1, fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  shareValue: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.textSecondary },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.placeholder, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
