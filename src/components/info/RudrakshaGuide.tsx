import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { infoStyles } from '@/components/info/styles';
import { rudrakshaGuides, type RudrakshaGuide as Guide } from '@/data/guides';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const ZOOM_FACTOR = 2;
/** Approximate height of the viewer's top bar, hint and safe-area insets. */
const VIEWER_CHROME = 140;

function GuideViewer({ guide, onClose }: { guide: Guide | null; onClose: () => void }) {
  const { width, height } = useResponsive();
  const [zoomed, setZoomed] = useState(false);

  const close = () => {
    setZoomed(false);
    onClose();
  };

  if (!guide) return null;

  const fitWidth = Math.min(width, ((height - VIEWER_CHROME) * guide.width) / guide.height);
  const imageWidth = zoomed ? Math.max(fitWidth, Math.min(guide.width, width * ZOOM_FACTOR)) : fitWidth;
  const imageHeight = (imageWidth * guide.height) / guide.width;

  return (
    <Modal visible animationType="fade" onRequestClose={close} statusBarTranslucent>
      <SafeAreaProvider>
        <SafeAreaView style={styles.viewer} edges={['top', 'bottom']}>
          <View style={styles.viewerBar}>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {guide.title}
            </Text>
            <Pressable
              onPress={() => setZoomed((value) => !value)}
              style={styles.viewerButton}
              accessibilityRole="button"
              accessibilityLabel={zoomed ? 'Fit to screen' : 'Zoom in'}
              hitSlop={8}
            >
              <Ionicons
                name={zoomed ? 'contract-outline' : 'expand-outline'}
                size={22}
                color={colors.surface}
              />
            </Pressable>
            <Pressable
              onPress={close}
              style={styles.viewerButton}
              accessibilityRole="button"
              accessibilityLabel="Close guide"
              hitSlop={8}
            >
              <Ionicons name="close" size={26} color={colors.surface} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.viewerScroll}>
            <ScrollView
              horizontal
              contentContainerStyle={[styles.viewerScrollRow, { minWidth: width }]}
            >
              <Pressable onPress={() => setZoomed((value) => !value)} accessibilityLabel={guide.title}>
                <Image
                  source={guide.image}
                  style={{ width: imageWidth, height: imageHeight }}
                  contentFit="contain"
                />
              </Pressable>
            </ScrollView>
          </ScrollView>
          <Text style={styles.viewerHint}>
            {zoomed ? 'Drag to explore · tap to fit' : 'Tap the image to zoom in'}
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export function RudrakshaGuide() {
  const [openGuide, setOpenGuide] = useState<Guide | null>(null);

  return (
    <>
      <Text style={styles.paragraph}>
        Each mukhi (face) of a rudraksha carries its own energy and ruling deity. Use these guides
        to pick the bead that suits your goals or zodiac sign. Tap any guide to view it full screen.
      </Text>
      {rudrakshaGuides.map((guide) => (
        <View key={guide.id} style={styles.card}>
          <Text style={styles.cardTitle}>{guide.title}</Text>
          <Text style={styles.paragraph}>{guide.summary}</Text>
          <Pressable
            onPress={() => setOpenGuide(guide)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Open ${guide.title} full screen`}
          >
            <Image
              source={guide.image}
              style={[styles.guideImage, { aspectRatio: guide.width / guide.height }]}
              contentFit="contain"
              transition={150}
            />
            <View style={styles.zoomBadge} pointerEvents="none">
              <Ionicons name="expand-outline" size={14} color={colors.surface} />
              <Text style={styles.zoomBadgeText}>View full screen</Text>
            </View>
          </Pressable>
        </View>
      ))}
      <GuideViewer guide={openGuide} onClose={() => setOpenGuide(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  ...infoStyles,
  guideImage: {
    width: '100%',
    marginTop: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.placeholder,
  },
  zoomBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
  },
  zoomBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: colors.surface,
  },
  viewer: {
    flex: 1,
    backgroundColor: '#140B07',
  },
  viewerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  viewerTitle: {
    flex: 1,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: colors.surface,
  },
  viewerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  /** minWidth (not flexGrow) so a zoomed image wider than the screen starts at x=0. */
  viewerScrollRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerHint: {
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
});
