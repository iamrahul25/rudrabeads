import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { categories, getFeaturedProducts, products } from '@/data/products';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_SIDE_INSET = spacing.lg;
const HERO_WIDTH = SCREEN_WIDTH - HERO_SIDE_INSET * 2;
const HERO_AUTO_MS = 4000;

type HeroSlide = {
  id: string;
  image: number;
  title: string;
  subtitle: string;
};

const heroSlides: HeroSlide[] = [
  {
    id: 'original',
    image: require('../../../assets/hero/hero-0-rudraksha-bead.jpg'),
    title: 'Authentic\nRudraksha',
    subtitle: 'Certified • Energized • Natural',
  },
  {
    id: 'mala',
    image: require('../../../assets/hero/hero-1-mala.jpg'),
    title: 'Sacred\nMalas',
    subtitle: 'Handpicked • Lab Tested • Blessed',
  },
  {
    id: 'prayer',
    image: require('../../../assets/hero/hero-2-hands-mala.jpg'),
    title: 'Prayer\nReady',
    subtitle: 'Worn with devotion every day',
  },
  {
    id: 'wear',
    image: require('../../../assets/hero/hero-3-rudraksha-bracelet.jpg'),
    title: 'Wear Your\nEnergy',
    subtitle: 'Bracelets • Beads • Everyday Strength',
  },
];

const mukhiChips = products
  .filter((p) => p.categoryId === 'nepali-rudraksha' && p.mukhi != null)
  .slice(0, 6);
const popular = getFeaturedProducts().slice(0, 4);

export default function HomeScreen() {
  const [heroIndex, setHeroIndex] = useState(0);
  const heroListRef = useRef<FlatList<HeroSlide>>(null);
  const heroIndexRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isDraggingRef.current) return;
      const next = (heroIndexRef.current + 1) % heroSlides.length;
      heroIndexRef.current = next;
      setHeroIndex(next);
      heroListRef.current?.scrollToIndex({ index: next, animated: true });
    }, HERO_AUTO_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader showBrand showNotifications showCart />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <FlatList
            ref={heroListRef}
            data={heroSlides}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            style={styles.heroPager}
            getItemLayout={(_, index) => ({
              length: HERO_WIDTH,
              offset: HERO_WIDTH * index,
              index,
            })}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              isDraggingRef.current = false;
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / HERO_WIDTH);
              if (nextIndex >= 0 && nextIndex < heroSlides.length) {
                heroIndexRef.current = nextIndex;
                setHeroIndex(nextIndex);
              }
            }}
            renderItem={({ item }) => (
              <View style={styles.heroSlide}>
                <Image source={item.image} style={styles.heroImage} contentFit="cover" />
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTitle}>{item.title}</Text>
                  <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                  <PrimaryButton
                    label="Shop Now"
                    style={styles.heroCta}
                    onPress={() => router.push('/(tabs)/search')}
                  />
                </View>
              </View>
            )}
          />

          <View style={styles.dots} pointerEvents="none">
            {heroSlides.map((slide, index) => (
              <View
                key={slide.id}
                style={[styles.dot, index === heroIndex && styles.dotActive]}
              />
            ))}
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
          {(popular.length ? popular : products.slice(0, 4)).map((product) => (
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
    marginHorizontal: HERO_SIDE_INSET,
    height: 210,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#5C2E1A',
  },
  heroPager: {
    flex: 1,
  },
  heroSlide: {
    width: HERO_WIDTH,
    height: 210,
  },
  heroImage: { ...StyleSheet.absoluteFill },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(44, 24, 16, 0.42)',
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 34,
    lineHeight: 36,
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.surface,
    opacity: 0.92,
    marginBottom: spacing.md,
  },
  heroCta: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: spacing.lg,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: colors.surface,
    width: 16,
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
