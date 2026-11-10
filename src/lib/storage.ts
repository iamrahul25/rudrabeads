import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'rudrabeads:';

export async function loadJSON(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function saveJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private browsing, quota); state still works in memory.
  }
}