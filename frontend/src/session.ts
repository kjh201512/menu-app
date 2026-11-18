import * as SecureStore from 'expo-secure-store';
import type { Session } from './types';
const KEY = 'menu-app.session.v1';
export async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
}
export async function readSession(): Promise<Session | null> {
  const value = await SecureStore.getItemAsync(KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<Session>;
    if (typeof parsed.accessToken !== 'string' || !parsed.accessToken ||
        !parsed.user || !Number.isSafeInteger(parsed.user.id) || typeof parsed.user.email !== 'string' ||
        (parsed.destination !== 'ONBOARDING' && parsed.destination !== 'HOME')) throw new Error('Invalid session');
    return parsed as Session;
  } catch { await clearSession(); return null; }
}
export async function clearSession(): Promise<void> { await SecureStore.deleteItemAsync(KEY); }
