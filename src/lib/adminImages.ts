import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const MAX_SIDE = 1600;
const QUALITY = 0.82;

/** Opens the photo picker and returns the chosen images as Blobs (empty when cancelled). */
export async function pickImages(multiple: boolean): Promise<Blob[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    quality: 1,
  });
  if (result.canceled) return [];
  return Promise.all(
    result.assets.map(async (asset) => asset.file ?? (await (await fetch(asset.uri)).blob())),
  );
}

/**
 * Web only: scales any photo down to MAX_SIDE pixels and re-encodes it as compressed WebP,
 * the only format the API stores. GIFs become a still image of their first frame.
 * An already-WebP photo that needs no resizing is kept when re-encoding would make it bigger.
 */
export async function toCompressedWebp(image: Blob): Promise<Blob> {
  if (Platform.OS !== 'web') throw new Error('Image uploads are only supported in the web admin panel.');

  const bitmap = await createImageBitmap(image, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bitmap) throw new Error('This image could not be read. Please use a JPG, PNG or WebP photo.');
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
  // Browsers without a WebP encoder silently fall back to PNG.
  if (!webp || webp.type !== 'image/webp') {
    throw new Error('This browser cannot convert images to WebP. Please use Chrome, Edge or Firefox.');
  }
  const keepOriginal = image.type === 'image/webp' && scale === 1 && image.size <= webp.size;
  return keepOriginal ? image : webp;
}
