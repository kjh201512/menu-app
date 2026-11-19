import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import type { NearbyRestaurant } from '../types';

type Props = {
  center: { lat: number; lng: number };
  restaurants: NearbyRestaurant[];
  selectedId: number | null;
  onSelect: (restaurantId: number) => void;
};

type MapState = 'loading' | 'ready' | 'error' | 'nokey';

let loader: Promise<any> | null = null;

function loadKakao(key: string): Promise<any> {
  const g = globalThis as any;
  if (g.kakao?.maps?.LatLng) return Promise.resolve(g.kakao);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const script = g.document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (g.kakao?.maps) g.kakao.maps.load(() => resolve(g.kakao));
      else reject(new Error('kakao'));
    };
    script.onerror = () => reject(new Error('kakao'));
    g.document.head.appendChild(script);
  });
  loader.catch(() => { loader = null; });
  return loader;
}

function pinStyle(selected: boolean): string {
  return [
    'display:flex', 'align-items:center', 'gap:4px', 'padding:6px 10px', 'border-radius:999px',
    'font:700 12px/1.2 -apple-system,"Malgun Gothic",sans-serif', 'white-space:nowrap', 'cursor:pointer',
    'box-shadow:0 4px 12px rgba(0,0,0,.35)',
    selected ? 'background:#FFFFFF;color:#E3262F;border:2px solid #E3262F;transform:scale(1.08)'
             : 'background:#E3262F;color:#FFFFFF;border:2px solid #0B0B0D',
  ].join(';');
}

export function KakaoMap({ center, restaurants, selectedId, onSelect }: Props) {
  const box = useRef<any>(null);
  const map = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [state, setState] = useState<MapState>('loading');
  const key = process.env.EXPO_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!key) { setState('nokey'); return; }
    let alive = true;
    loadKakao(key).then(kakao => {
      if (!alive || !box.current) return;
      map.current = new kakao.maps.Map(box.current, { center: new kakao.maps.LatLng(center.lat, center.lng), level: 5 });
      map.current.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      setState('ready');
    }).catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [key]);

  useEffect(() => {
    if (state !== 'ready' || !box.current) return;
    const Observer = (globalThis as any).ResizeObserver;
    if (!Observer) return;
    const observer = new Observer(() => map.current?.relayout());
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [state]);

  useEffect(() => {
    if (state !== 'ready') return;
    const kakao = (globalThis as any).kakao;
    map.current.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
  }, [state, center.lat, center.lng]);

  useEffect(() => {
    if (state !== 'ready') return;
    const kakao = (globalThis as any).kakao;
    const doc = (globalThis as any).document;
    overlays.current.forEach(overlay => overlay.setMap(null));
    overlays.current = [];

    const me = doc.createElement('div');
    me.title = '기준 위치';
    me.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #FFFFFF;box-shadow:0 0 0 6px rgba(59,130,246,.25)';
    overlays.current.push(new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(center.lat, center.lng), content: me, map: map.current, zIndex: 1,
    }));

    restaurants.forEach(r => {
      const selected = r.restaurantId === selectedId;
      const pin = doc.createElement('button');
      pin.type = 'button';
      pin.textContent = r.name;
      pin.setAttribute('aria-label', `${r.name} 상세 보기`);
      pin.style.cssText = pinStyle(selected);
      pin.onclick = () => selectRef.current(r.restaurantId);
      overlays.current.push(new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(r.latitude, r.longitude), content: pin, yAnchor: 1.3,
        clickable: true, map: map.current, zIndex: selected ? 4 : 2,
      }));
    });
  }, [state, restaurants, selectedId, center.lat, center.lng]);

  useEffect(() => {
    if (state !== 'ready' || selectedId == null) return;
    const target = restaurants.find(r => r.restaurantId === selectedId);
    if (!target) return;
    const kakao = (globalThis as any).kakao;
    map.current.panTo(new kakao.maps.LatLng(target.latitude, target.longitude));
  }, [state, selectedId, restaurants]);

  const message = state === 'nokey'
    ? '카카오맵 키가 없어요. frontend/.env의 EXPO_PUBLIC_KAKAO_MAP_KEY를 확인해 주세요.'
    : state === 'error'
      ? '지도를 불러오지 못했어요. 인터넷 연결과 카카오 개발자 사이트의 JavaScript SDK 도메인 등록(http://localhost:8081)을 확인해 주세요.'
      : '지도를 불러오는 중…';

  return <View style={s.wrap}>
    <div ref={box} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    {state !== 'ready' && <View style={s.overlay}><Text style={s.message}>{message}</Text></View>}
  </View>;
}

const s = StyleSheet.create({
  wrap: { flex: 1, minHeight: 280, borderRadius: 18, overflow: 'hidden', backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: C.sub, textAlign: 'center', lineHeight: 22 },
});
