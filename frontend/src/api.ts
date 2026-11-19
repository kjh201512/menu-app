import type { AuthResponse, User, Category, Restriction, Profile, Recommendations, Selection, RestaurantDetail, Nearby } from './types';
const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const baseUrl = rawBaseUrl?.replace(/\/$/, '');
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string,
              public fieldErrors: Record<string, string> = {}) { super(message); }
}
async function request<T>(path: string, method: 'POST' | 'GET' | 'PUT', body?: unknown, token?: string): Promise<T> {
  if (!baseUrl) throw new ApiError(0, 'CONFIG_ERROR', '.env의 EXPO_PUBLIC_API_BASE_URL을 설정해 주세요.');
  if (!__DEV__ && !baseUrl.startsWith('https://'))
    throw new ApiError(0, 'CONFIG_ERROR', '배포 앱은 HTTPS API 주소를 사용해야 합니다.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(baseUrl + path, {
      method, signal: controller.signal,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                 ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, data?.code ?? 'HTTP_ERROR',
      data?.message ?? '요청을 처리하지 못했습니다.', data?.fieldErrors ?? {});
    if (data === null) throw new ApiError(response.status, 'INVALID_RESPONSE', '서버 응답 형식을 확인해 주세요.');
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError(0, 'TIMEOUT', '요청 시간이 초과되었습니다. 다시 시도해 주세요.');
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다. 네트워크와 API 주소를 확인해 주세요.');
  } finally { clearTimeout(timer); }
}
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return baseUrl ? baseUrl + path : null;
}
const q = encodeURIComponent;
export const api = {
  signup: (email: string, password: string) => request<AuthResponse>('/api/auth/signup', 'POST', { email, password }),
  login: (email: string, password: string) => request<AuthResponse>('/api/auth/login', 'POST', { email, password }),
  me: (token: string) => request<User>('/api/users/me', 'GET', undefined, token),
  profile: (token: string) => request<Profile>('/api/users/me/profile', 'GET', undefined, token),
  preferences: (token: string, categories: Category[]) => request<Profile>('/api/users/me/preferences', 'PUT', { categories }, token),
  restrictions: (token: string, items: Restriction[]) => request<Profile>('/api/users/me/restrictions', 'PUT', { items }, token),
  recommendations: (token: string, lat: number, lng: number) => request<Recommendations>(`/api/recommendations?lat=${q(lat)}&lng=${q(lng)}`, 'GET', undefined, token),
  select: (token: string, sessionId: string, menuId: number) => request<Selection>(`/api/recommendations/${q(sessionId)}/select`, 'POST', { menuId }, token),
  reject: (token: string, sessionId: string, lat: number, lng: number) => request<Recommendations>(`/api/recommendations/${q(sessionId)}/reject`, 'POST', { lat, lng }, token),
  restaurant: (token: string, restaurantId: number, lat: number, lng: number) => request<RestaurantDetail>(`/api/restaurants/${restaurantId}?lat=${q(lat)}&lng=${q(lng)}`, 'GET', undefined, token),
  nearby: (token: string, lat: number, lng: number, category?: Category | null) =>
    request<Nearby>(`/api/restaurants/nearby?lat=${q(lat)}&lng=${q(lng)}&radius=1000${category ? `&category=${category}` : ''}`, 'GET', undefined, token),
};
