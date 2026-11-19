import * as Location from 'expo-location';

export type Place = { lat: number; lng: number; label: string };

export const DEMO_PLACE: Place = { lat: 36.3622, lng: 127.3510, label: '충남대 궁동' };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

export async function currentPlace(): Promise<Place> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted')
    throw new Error('위치 권한이 거부되었어요. 데모 위치(충남대 궁동)로 계속 볼 수 있어요.');
  try {
    const position = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 10000);
    return { lat: position.coords.latitude, lng: position.coords.longitude, label: '현재 위치' };
  } catch (e) {
    if (e instanceof Error && e.message === 'TIMEOUT')
      throw new Error('위치를 가져오는 데 시간이 오래 걸려요. 잠시 후 다시 시도해 주세요.');
    throw new Error('현재 위치를 가져오지 못했어요. 윈도우 위치 서비스가 켜져 있는지 확인해 주세요.');
  }
}
