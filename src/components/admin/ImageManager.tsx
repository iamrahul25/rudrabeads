import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Notice } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminContext';
import { uploadImage } from '@/lib/adminApi';
import { pickImages, toCompressedWebp } from '@/lib/adminImages';
import { errorMessage } from '@/lib/api';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export type ManagedImage = { key: string; url: string };

type Props = {
  images: ManagedImage[];
  onChange: (images: ManagedImage[]) => void;
  /** Called with every image uploaded here, so the form can discard ones that never get saved. */
  onUploaded: (image: ManagedImage) => void;
  max: number;
  /** Single-image mode (e.g. category image): picking replaces the current image. */
  single?: boolean;
};

export function ImageManager({ images, onChange, onUploaded, max, single = false }: Props) {
  const { run } = useAdmin();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const room = single ? 1 : max - images.length;

  const add = async () => {
    setError(null);
    let picked: Blob[];
    try {
      picked = await pickImages(!single);
    } catch (err) {
      setError(errorMessage(err));
      return;
    }
    if (!picked.length) return;
    const batch = picked.slice(0, room);
    const skipped = picked.length - batch.length;

    const uploaded: ManagedImage[] = [];
    try {
      for (const [index, file] of batch.entries()) {
        setProgress(`Compressing ${index + 1} of ${batch.length}…`);
        const webp = await toCompressedWebp(file);
        setProgress(`Uploading ${index + 1} of ${batch.length}…`);
        const image = await run((token) => uploadImage(token, webp));
        onUploaded(image);
        uploaded.push(image);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProgress(null);
    }
    if (uploaded.length) onChange(single ? uploaded.slice(0, 1) : [...images, ...uploaded]);
    if (skipped > 0) setError(`Only ${max} images are allowed, so ${skipped} ${skipped === 1 ? 'was' : 'were'} skipped.`);
  };

  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {images.map((image, index) => (
          <View key={image.key} style={styles.tile}>
            <Image source={image.url} style={styles.image} contentFit="cover" />
            {!single && index === 0 ? (
              <View style={styles.cover}>
                <Text style={styles.coverText}>Cover</Text>
              </View>
            ) : null}
            <View style={styles.tools}>
              {!single ? (
                <>
                  <Tool icon="chevron-back" label="Move left" disabled={index === 0} onPress={() => move(index, index - 1)} />
                  <Tool icon="star-outline" label="Make cover" disabled={index === 0} onPress={() => move(index, 0)} />
                  <Tool
                    icon="chevron-forward"
                    label="Move right"
                    disabled={index === images.length - 1}
                    onPress={() => move(index, index + 1)}
                  />
                </>
              ) : null}
              <Tool
                icon="trash-outline"
                label="Remove image"
                danger
                onPress={() => onChange(images.filter((item) => item.key !== image.key))}
              />
            </View>
          </View>
        ))}
        {images.length === 0 ? (
          <View style={[styles.tile, styles.emptyTile]}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No image</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button
          label={single ? (images.length ? 'Replace image' : 'Upload image') : 'Add images'}
          icon="cloud-upload-outline"
          variant="outline"
          onPress={add}
          busy={!!progress}
          disabled={room <= 0}
        />
        <Text style={styles.hint}>
          {progress ??
            (single
              ? 'Photos are resized and saved as compressed WebP.'
              : `${images.length} of ${max} images. The first one is the cover. Photos are resized and saved as compressed WebP.`)}
        </Text>
      </View>
      <Notice tone="error" message={error} />
    </View>
  );
}

function Tool({
  icon,
  label,
  onPress,
  disabled = false,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.tool, disabled && styles.toolDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
    >
      <Ionicons name={icon} size={15} color={danger ? colors.danger : colors.text} />
    </Pressable>
  );
}

const TILE = 132;

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  cover: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  coverText: { fontFamily: 'DMSans_700Bold', fontSize: 10, color: colors.surface },
  tools: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 2,
  },
  tool: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  toolDisabled: { opacity: 0.3 },
  emptyTile: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.placeholder },
  emptyText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.textMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  hint: { flex: 1, minWidth: 200, fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted },
});
