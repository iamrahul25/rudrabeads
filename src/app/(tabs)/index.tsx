import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { CategoryCard } from '@/components/CategoryCard';
import { MukhiMarquee } from '@/components/MukhiMarquee';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductGrid } from '@/components/ProductGrid';
import { SectionHeader } from '@/components/SectionHeader';
import { categories, getFeaturedProducts, products } from '@/data/products';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const HERO_SIDE_INSET = spacing.lg;
const HERO_AUTO_MS = 4000;

function getHeroHeight(heroWidth: number) {
  return Math.round(Math.min(380, Math.max(210, heroWidth * 0.36)));
}
const STYLE_GAP = spacing.md; // ≥8px touch spacing (ui-ux-pro-max)
const STYLE_PAD = spacing.lg;

/** Column count from the live viewport. Each row is a flex row, so tiles always fill it. */
function getStyleColumns(width: number) {
  if (width >= 900) return 4;
  if (width >= 560) return 3;
  return 2;
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

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

const featured = getFeaturedProducts();
const popularPool = [...featured, ...products.filter((item) => !item.featured)];

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const { productColumns, isTablet } = useResponsive();
  const [heroIndex, setHeroIndex] = useState(0);
  const heroListRef = useRef<FlatList<HeroSlide>>(null);
  const heroIndexRef = useRef(0);
  const isDraggingRef = useRef(false);
  const styleColumns = getStyleColumns(windowWidth);
  const styleRows = chunkItems(categories, styleColumns);
  const heroWidth = windowWidth - HERO_SIDE_INSET * 2;
  const heroHeight = getHeroHeight(heroWidth);
  const popular = popularPool.slice(0, productColumns * 2);

  useEffect(() => {
    heroListRef.current?.scrollToOffset({
      offset: heroIndexRef.current * heroWidth,
      animated: false,
    });
  }, [heroWidth]);

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
        <View style={[styles.hero, { height: heroHeight }]}>
          <FlatList
            ref={heroListRef}
            data={heroSlides}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            style={styles.heroPager}
            extraData={heroWidth}
            getItemLayout={(_, index) => ({
              length: heroWidth,
              offset: heroWidth * index,
              index,
            })}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              isDraggingRef.current = false;
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
              if (nextIndex >= 0 && nextIndex < heroSlides.length) {
                heroIndexRef.current = nextIndex;
                setHeroIndex(nextIndex);
              }
            }}
            renderItem={({ item }) => (
              <View style={{ width: heroWidth, height: heroHeight }}>
                <Image source={item.image} style={styles.heroImage} contentFit="cover" />
                <View style={[styles.heroOverlay, isTablet && styles.heroOverlayTablet]}>
                  <Text style={[styles.heroTitle, isTablet && styles.heroTitleTablet]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.heroSubtitle, isTablet && styles.heroSubtitleTablet]}>
                    {item.subtitle}
                  </Text>
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

        <SectionHeader title="Shop by Mukhi" onAction={() => router.push('/(tabs)/search')} />
        <MukhiMarquee />

        <SectionHeader title="Shop by Style" onAction={() => router.push('/(tabs)/categories')} />
        <View style={styles.styleGrid}>
          {styleRows.map((row, rowIndex) => (
            <View key={row[0]?.id ?? rowIndex} style={styles.styleRow}>
              {row.map((item) => (
                <CategoryCard key={item.id} category={item} />
              ))}
              {Array.from({ length: styleColumns - row.length }).map((_, spacerIndex) => (
                <View key={`spacer-${rowIndex}-${spacerIndex}`} style={styles.styleSpacer} />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.trust}>
          <Ionicons name="shield-checkmark" size={20} color={colors.surface} />
          <Text style={styles.trustText}>100% Authentic · Lab Tested Beads</Text>
        </View>

        <SectionHeader title="Popular Products" onAction={() => router.push('/(tabs)/search')} />
        <ProductGrid products={popular} style={styles.productGrid} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  hero: {
    marginHorizontal: HERO_SIDE_INSET,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#5C2E1A',
  },
  heroPager: {
    flex: 1,
  },
  heroImage: { ...StyleSheet.absoluteFill },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(44, 24, 16, 0.42)',
  },
  heroOverlayTablet: {
    paddingHorizontal: spacing.xxxl * 1.5,
  },
  heroTitleTablet: {
    fontSize: 48,
    lineHeight: 52,
    marginBottom: spacing.sm,
  },
  heroSubtitleTablet: {
    fontSize: 15,
    marginBottom: spacing.lg,
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
  styleGrid: {
    paddingHorizontal: STYLE_PAD,
    gap: STYLE_GAP,
  },
  styleRow: {
    flexDirection: 'row',
    width: '100%',
    gap: STYLE_GAP,
  },
  styleSpacer: {
    flex: 1,
    minWidth: 0,
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
  },
});
