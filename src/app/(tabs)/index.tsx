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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { MukhiMarquee } from '@/components/MukhiMarquee';
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

const popular = getFeaturedProducts().slice(0, 4);

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [heroIndex, setHeroIndex] = useState(0);
  const heroListRef = useRef<FlatList<HeroSlide>>(null);
  const heroIndexRef = useRef(0);
  const isDraggingRef = useRef(false);
  const styleColumns = getStyleColumns(windowWidth);
  const styleRows = chunkItems(categories, styleColumns);

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

        <SectionHeader title="Shop by Mukhi" onAction={() => router.push('/(tabs)/search')} />
        <MukhiMarquee />

        <SectionHeader title="Shop by Style" onAction={() => router.push('/(tabs)/categories')} />
        <View style={styles.styleGrid}>
          {styleRows.map((row, rowIndex) => (
            <View key={row[0]?.id ?? rowIndex} style={styles.styleRow}>
              {row.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.styleCard}
                  onPress={() => router.push(`/category/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                >
                  <Image source={item.image} style={styles.styleImage} contentFit="cover" />
                  <Text style={styles.styleLabel} numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>
              ))}
              {Array.from({ length: styleColumns - row.length }).map((_, spacerIndex) => (
                <View key={`spacer-${rowIndex}-${spacerIndex}`} style={styles.styleCard} />
              ))}
            </View>
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
  styleGrid: {
    paddingHorizontal: STYLE_PAD,
    gap: STYLE_GAP,
  },
  styleRow: {
    flexDirection: 'row',
    width: '100%',
    gap: STYLE_GAP,
  },
  styleCard: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  styleImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  styleLabel: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
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
