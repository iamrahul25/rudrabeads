import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ImageRef } from '@/data/products';
import { colors } from '@/theme/colors';

type Props = {
  source: ImageRef | null | undefined;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** Hides the caption for small thumbnails where only the icon fits. */
  compact?: boolean;
};

export function ProductImage({ source, style, contentFit = 'contain', compact = false }: Props) {
  const [failed, setFailed] = useState(false);
  const [lastSource, setLastSource] = useState(source);

  // The catalogue can swap bundled images for remote ones, so a new source gets a fresh attempt.
  if (lastSource !== source) {
    setLastSource(source);
    setFailed(false);
  }

  if (source == null || failed) {
    return (
      <View
        style={[style as StyleProp<ViewStyle>, styles.placeholder]}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Image not available"
      >
        <Ionicons name="image-outline" size={compact ? 20 : 32} color={colors.textMuted} />
        {compact ? null : <Text style={styles.caption}>Image coming soon</Text>}
      </View>
    );
  }

  return (
    <Image source={source} style={style} contentFit={contentFit} onError={() => setFailed(true)} />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  caption: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
