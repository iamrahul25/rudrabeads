import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { categories, products } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const mukhiChips = products.filter((p) => p.category === 'rudraksha').slice(0, 6);

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image
            source={require('../../../assets/hero/authentic-rudraksha.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroEyebrow}>Sacred Collection</Text>
            <Text style={styles.heroTitle}>Authentic{'\n'}Rudraksha</Text>
            <PrimaryButton
              label="Shop Now"
              style={styles.heroCta}
              onPress={() => router.push('/(tabs)/search')}
            />
          </View>
        </View>

        <SectionHeader title="Shop by Style" onAction={() => router.push('/(tabs)/categories')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hPad}
        >
          {categories.map((item) => (
            <Pressable
              key={item.id}
              style={styles.circleItem}
              onPress={() => router.push('/(tabs)/categories')}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <View style={styles.circle}>
                <Image source={item.image} style={styles.circleImage} contentFit="cover" />
              </View>
              <Text style={styles.circleLabel}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader title="Shop by Mukhi" onAction={() => router.push('/(tabs)/search')} />
        <View style={styles.mukhiGrid}>
          {mukhiChips.map((item) => (
            <Pressable
              key={item.id}
              style={styles.mukhiCard}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              <Image source={item.image} style={styles.mukhiImage} contentFit="cover" />
              <Text style={styles.mukhiLabel}>{item.mukhi} Mukhi</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.trust}>
          <Ionicons name="shield-checkmark" size={20} color={colors.surface} />
          <Text style={styles.trustText}>100% Authentic · Lab Tested Beads</Text>
        </View>

        <SectionHeader title="Popular Products" onAction={() => router.push('/(tabs)/search')} />
        <View style={styles.productGrid}>
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  hero: {
    marginHorizontal: spacing.lg,
    height: 190,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  heroImage: { ...StyleSheet.absoluteFill },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(44, 24, 16, 0.28)',
  },
  heroEyebrow: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.surface,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 34,
    lineHeight: 36,
    color: colors.surface,
    marginBottom: spacing.md,
  },
  heroCta: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: spacing.lg,
  },
  hPad: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  circleItem: {
    width: 72,
    alignItems: 'center',
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  circleImage: { width: '100%', height: '100%' },
  circleLabel: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mukhiGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mukhiCard: {
    width: '31%',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  mukhiImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  mukhiLabel: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.text,
  },
  trust: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trustText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.surface,
  },
  productGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
