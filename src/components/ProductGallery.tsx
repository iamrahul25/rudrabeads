import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ProductImage } from '@/components/ProductImage';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

const THUMB_SIZE = 60;
const THUMB_GAP = spacing.sm;

type Props = {
  images: number[];
  /** Outer wrapper (margins / width). */
  style?: StyleProp<ViewStyle>;
  /** Main image frame (height / aspect ratio / radius / background). */
  frameStyle?: StyleProp<ViewStyle>;
};

export function ProductGallery({ images, style, frameStyle }: Props) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const frameWidth = frame.width;
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<number>>(null);
  const thumbsRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const indexRef = useRef(0);
  const [thumbsWidth, setThumbsWidth] = useState(0);
  const hasGallery = images.length > 1;

  useEffect(() => {
    if (!frameWidth) return;
    listRef.current?.scrollToOffset({ offset: indexRef.current * frameWidth, animated: false });
  }, [frameWidth]);

  useEffect(() => {
    if (!thumbsWidth) return;
    const centered = index * (THUMB_SIZE + THUMB_GAP) - (thumbsWidth - THUMB_SIZE) / 2;
    thumbsRef.current?.scrollTo({ x: Math.max(0, centered), animated: true });
  }, [index, thumbsWidth]);

  const onFrameLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    const height = Math.round(event.nativeEvent.layout.height);
    if (width !== frame.width || height !== frame.height) setFrame({ width, height });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!frameWidth) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / frameWidth);
    if (next !== indexRef.current && next >= 0 && next < images.length) {
      indexRef.current = next;
      setIndex(next);
    }
  };

  const goTo = (next: number) => {
    indexRef.current = next;
    setIndex(next);
    listRef.current?.scrollToOffset({ offset: next * frameWidth, animated: true });
  };

  return (
    <View style={style}>
      <View style={[styles.frame, frameStyle]} onLayout={onFrameLayout}>
        {hasGallery && frameWidth > 0 ? (
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(item, itemIndex) => `${item}-${itemIndex}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={onScroll}
            style={StyleSheet.absoluteFill}
            extraData={frame}
            getItemLayout={(_, itemIndex) => ({
              length: frameWidth,
              offset: frameWidth * itemIndex,
              index: itemIndex,
            })}
            renderItem={({ item, index: itemIndex }) => (
              <View
                style={{ width: frameWidth, height: frame.height }}
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Product image ${itemIndex + 1} of ${images.length}`}
              >
                <ProductImage source={item} style={styles.image} />
              </View>
            )}
          />
        ) : (
          <ProductImage source={images[0]} style={styles.image} />
        )}

        {hasGallery ? (
          <View style={styles.dots} pointerEvents="none">
            {images.map((item, dotIndex) => (
              <View
                key={`${item}-${dotIndex}`}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {hasGallery ? (
        <ScrollView
          ref={thumbsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
          onLayout={(event) => setThumbsWidth(Math.round(event.nativeEvent.layout.width))}
        >
          {images.map((item, thumbIndex) => {
            const active = thumbIndex === index;
            return (
              <Pressable
                key={`${item}-${thumbIndex}`}
                onPress={() => goTo(thumbIndex)}
                style={[styles.thumb, active && styles.thumbActive]}
                accessibilityRole="button"
                accessibilityLabel={`Show image ${thumbIndex + 1} of ${images.length}`}
                accessibilityState={{ selected: active }}
              >
                <ProductImage source={item} style={styles.thumbImage} compact />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
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
    backgroundColor: colors.primaryMuted,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
  thumbs: {
    gap: THUMB_GAP,
    paddingTop: spacing.md,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    opacity: 0.7,
  },
  thumbActive: {
    borderColor: colors.primary,
    opacity: 1,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
