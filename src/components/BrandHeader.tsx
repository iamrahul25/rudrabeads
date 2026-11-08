import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Props = {
  showSearch?: boolean;
  showCart?: boolean;
  title?: string;
  onBack?: () => void;
};

export function BrandHeader({
  showSearch = true,
  showCart = true,
  title,
  onBack,
}: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Text style={styles.logoGlyph}>R</Text>
          </View>
          <Text style={styles.brandName}>RudraBeads</Text>
        </View>
      )}

      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.flex} />}

      <View style={styles.actions}>
        {showSearch ? (
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={styles.iconBtn}
          >
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        {showCart ? (
          <Pressable
            onPress={() => router.push('/cart')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cart"
            style={styles.iconBtn}
          >
            <Ionicons name="bag-handle-outline" size={22} color={colors.text} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    color: colors.surface,
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 18,
  },
  brandName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 24,
    color: colors.text,
    letterSpacing: 0.2,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  flex: { flex: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
});
