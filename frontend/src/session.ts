import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Session } from './types';

const KEY = 'menu-app.session.v1';

type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const webStorage = (globalThis as unknown as { localStorage?: WebStorage }).localStorage;

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveSession(session: Session): Promise<void> {
  await setItem(KEY, JSON.stringify(session));
}

export async function readSession(): Promise<Session | null> {
  const value = await getItem(KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<Session>;
    if (typeof parsed.accessToken !== 'string' || !parsed.accessToken ||
        !parsed.user || !Number.isSafeInteger(parsed.user.id) || typeof parsed.user.email !== 'string' ||
        (parsed.destination !== 'ONBOARDING' && parsed.destination !== 'HOME')) throw new Error('Invalid session');
    return parsed as Session;
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await removeItem(KEY);
}
