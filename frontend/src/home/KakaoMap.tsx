import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import type { NearbyRestaurant } from '../types';

type Props = {
  center: { lat: number; lng: number };
  restaurants: NearbyRestaurant[];
  selectedId: number | null;
  onSelect: (restaurantId: number) => void;
};

export function KakaoMap({ restaurants }: Props) {
  return <View style={s.wrap}>
    <Text style={s.title}>지도는 웹 화면에서 표시돼요</Text>
    <Text style={s.sub}>주변 가게 {restaurants.length}곳은 아래 목록에서 볼 수 있어요.</Text>
  </View>;
}

const s = StyleSheet.create({
  wrap: { flex: 1, minHeight: 200, borderRadius: 18, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: C.text, fontWeight: '700', marginBottom: 6 },
  sub: { color: C.sub },
});
