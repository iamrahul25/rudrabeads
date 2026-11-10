import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductGallery } from '@/components/ProductGallery';
import { QuantityStepper } from '@/components/QuantityStepper';
import { UnderlinedHeading } from '@/components/UnderlinedHeading';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { business } from '@/data/business';
import { formatINR, getProductById } from '@/data/products';
import { useGoBack } from '@/hooks/useGoBack';
import { useResponsive } from '@/hooks/useResponsive';
import { isPurchasable, minOrderQty } from '@/lib/cart';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const trustItems = [
  { icon: 'flask-outline' as const, label: 'Lab Tested' },
  { icon: 'leaf-outline' as const, label: 'Natural' },
  { icon: 'diamond-outline' as const, label: 'Pure' },
  { icon: 'refresh-outline' as const, label: 'Easy Returns' },
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBack = useGoBack('/');
  const { isTablet } = useResponsive();
  const product = getProductById(String(id));
  const { addItem, setQty: setCartQty, getQty } = useCart();
  const wishlist = useWishlist();
  const moq = product ? minOrderQty(product) : 1;
  const [qty, setQty] = useState(moq);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return undefined;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Product not found</Text>
        <PrimaryButton label="Go Home" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const purchasable = isPurchasable(product);
  const inCart = getQty(product.id);

  const share = async () => {
    const price = product.price != null ? ` – ${formatINR(product.price)}` : '';
    try {
      await Share.share({ message: `${product.name}${price} from ${business.name}` });
    } catch {
      // Share sheet unavailable or dismissed.
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BrandHeader
        onBack={goBack}
        showShare
        showWishlist
        showCart
        onShare={share}
        wishlistActive={wishlist.has(product.id)}
        onWishlist={() => wishlist.toggle(product.id)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
      >
        <ProductGallery
          key={product.id}
          images={product.images}
          style={[styles.gallery, isTablet && styles.galleryTablet]}
          frameStyle={[styles.hero, isTablet && styles.heroTablet]}
        />

        <View style={[styles.body, isTablet && styles.bodyTablet]}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>
              {product.category}
              {product.mukhi != null ? ` · ${product.mukhi} Mukhi` : ''}
              {product.origin ? ` · ${product.origin}` : ''}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(product.price)}</Text>
            {product.price != null && product.priceUnit ? (
              <Text style={styles.original}>/ {product.priceUnit}</Text>
            ) : null}
            {product.minOrderQty != null ? (
              <View style={styles.discount}>
                <Text style={styles.discountText}>
                  MOQ {product.minOrderQty} {product.minOrderUnit || ''}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.trustRow}>
            {trustItems.map((item) => (
              <View key={item.label} style={styles.trustItem}>
                <View style={styles.trustIcon}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.trustLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {product.benefits.length ? (
            <>
              <UnderlinedHeading
                style={styles.sectionTitleWrap}
                textStyle={styles.sectionTitle}
                lineWidth={28}
              >
                Highlights
              </UnderlinedHeading>
              {product.benefits.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </>
          ) : null}

          {Object.keys(product.specs).length ? (
            <>
              <UnderlinedHeading
                style={styles.sectionTitleWrap}
                textStyle={styles.sectionTitle}
                lineWidth={28}
              >
                Specifications
              </UnderlinedHeading>
              {Object.entries(product.specs).map(([key, value]) => (
                <View key={key} style={styles.benefitRow}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.benefitText}>{value}</Text>
                </View>
              ))}
            </>
          ) : null}

          <UnderlinedHeading
            style={styles.sectionTitleWrap}
            textStyle={styles.sectionTitle}
            lineWidth={28}
          >
            Details
          </UnderlinedHeading>
          <Text style={styles.description}>{product.description}</Text>

          {purchasable ? (
            <View style={styles.qtyRow}>
              <View>
                <Text style={styles.qtyLabel}>Quantity</Text>
                {moq > 1 ? (
                  <Text style={styles.qtyHint}>
                    Minimum order {moq} {product.minOrderUnit || 'units'}
                  </Text>
                ) : null}
                {inCart > 0 ? <Text style={styles.qtyHint}>{inCart} already in cart</Text> : null}
              </View>
              <QuantityStepper value={qty} min={moq} onChange={setQty} />
            </View>
          ) : (
            <Text style={styles.onRequest}>
              Price for this item is shared on request. Call us and we will get back with the best
              quote.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, isTablet && styles.footerTablet]}>
        {purchasable ? (
          <>
            <PrimaryButton
              label={added ? 'Added ✓' : 'Add to Cart'}
              variant="outline"
              style={[styles.footerBtn, isTablet && styles.footerBtnTablet]}
              onPress={() => {
                addItem(product.id, qty);
                setAdded(true);
              }}
            />
            <PrimaryButton
              label="Buy Now"
              style={[styles.footerBtn, isTablet && styles.footerBtnTablet]}
              onPress={() => {
                setCartQty(product.id, Math.max(qty, inCart));
                router.push('/cart');
              }}
            />
          </>
        ) : (
          <PrimaryButton
            label="Call for Price"
            style={[styles.footerBtn, isTablet && styles.footerBtnTablet]}
            onPress={() => Linking.openURL(`tel:${business.phone}`).catch(() => undefined)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  contentTablet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  gallery: {
    marginHorizontal: spacing.lg,
  },
  galleryTablet: {
    marginHorizontal: 0,
    width: '45%',
  },
  hero: {
    height: 340,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  heroTablet: {
    height: undefined,
    aspectRatio: 1,
  },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  bodyTablet: { flex: 1, paddingHorizontal: 0, paddingTop: 0 },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: colors.text,
  },
  ratingRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: colors.primary,
  },
  original: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  specKey: {
    width: 120,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  discount: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  discountText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
  trustRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: { alignItems: 'center', width: '23%' },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: {
    marginTop: spacing.xs,
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitleWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  benefitText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  qtyRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  qtyHint: {
    marginTop: 2,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  onRequest: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerTablet: { justifyContent: 'flex-end', paddingHorizontal: spacing.xl },
  footerBtn: { flex: 1 },
  footerBtnTablet: { flex: 0, minWidth: 200 },
  missing: {
    margin: spacing.xl,
    fontFamily: 'DMSans_500Medium',
    color: colors.text,
  },
});
