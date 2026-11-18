import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { MenuCard } from './types';
import { CATEGORY_LABELS } from './catalog';
export function RecommendationCards({ items }: { items: MenuCard[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(160, Math.min(width, 540) - 48);
  const list = useRef<FlatList<MenuCard>>(null);
  const [index, setIndex] = useState(0);
  const activeIndex = Math.min(index, Math.max(0, items.length - 1));
  function move(next: number) {
    if (next < 0 || next >= items.length) return;
    list.current?.scrollToIndex({ index: next, animated: true }); setIndex(next);
  }
  if (!items.length) return <Text style={s.empty}>표시할 메뉴가 없습니다. 알레르기 필터를 완화하지 않습니다.</Text>;
  return <View>
    <Text style={s.counter}>추천 {activeIndex + 1} / {items.length} · 좌우로 넘겨 보세요</Text>
    <FlatList key={String(cardWidth)} ref={list} data={items} horizontal pagingEnabled
      showsHorizontalScrollIndicator={false} keyExtractor={item => String(item.menuId)}
      style={{ width: cardWidth, flexGrow: 0 }}
      getItemLayout={(_, i) => ({ length: cardWidth, offset: cardWidth * i, index: i })}
      onMomentumScrollEnd={event => setIndex(Math.round(event.nativeEvent.contentOffset.x / cardWidth))}
      renderItem={({ item }) => <View style={{ width: cardWidth, padding: 2 }}>
        <View style={s.card} accessible accessibilityLabel={`${item.menuName}, ${item.restaurantName}, ${item.distanceMeters}미터`}>
          <View style={s.badge}><Text style={s.badgeText}>{CATEGORY_LABELS[item.category]}{item.preferred ? ' · 선호 카테고리' : ''}</Text></View>
          <Text style={s.menu}>{item.menuName}</Text><Text style={s.restaurant}>{item.restaurantName}</Text>
          <Text style={s.distance}>{item.distanceMeters.toLocaleString()} m · 직선거리</Text>
          <View style={s.divider} /><Text style={s.price}>{item.price.toLocaleString()}원</Text>
          <Text style={s.label}>등록된 식재료</Text><Text style={s.ingredients}>{item.ingredients.join(' · ')}</Text>
          <Text style={s.notice}>데이터 기준 필터 결과입니다. 실제 알레르겐·교차오염은 식당에 직접 확인하세요.</Text>
        </View>
      </View>} />
    <View style={s.nav}>
      <Pressable accessibilityRole="button" accessibilityLabel="이전 메뉴" disabled={activeIndex === 0} onPress={() => move(activeIndex - 1)} style={[s.navButton, activeIndex === 0 && s.disabled]}><Text>이전</Text></Pressable>
      <Text style={s.dots}>{items.map((_, i) => i === activeIndex ? '●' : '○').join('  ')}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="다음 메뉴" disabled={activeIndex === items.length - 1} onPress={() => move(activeIndex + 1)} style={[s.navButton, activeIndex === items.length - 1 && s.disabled]}><Text>다음</Text></Pressable>
    </View>
  </View>;
}
const s = StyleSheet.create({
  empty: { color: '#6A746D', paddingVertical: 30, lineHeight: 25 }, counter: { color: '#617365', fontSize: 13, marginBottom: 14 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE5D9', padding: 22, borderRadius: 23, minHeight: 345 },
  badge: { backgroundColor: '#E6EEDC', padding: 9, borderRadius: 10, alignSelf: 'flex-start' }, badgeText: { color: '#34704F', fontSize: 12, fontWeight: '700' },
  menu: { color: '#203D2B', fontSize: 27, fontWeight: '800', marginTop: 25, marginBottom: 10 }, restaurant: { color: '#58665B', fontSize: 16 },
  distance: { color: '#34704F', fontWeight: '700', marginTop: 10 }, divider: { height: 1, backgroundColor: '#E5E9E2', marginVertical: 22 },
  price: { fontSize: 22, fontWeight: '800', color: '#203D2B', marginBottom: 20 }, label: { fontSize: 12, color: '#69786C', marginBottom: 7 },
  ingredients: { color: '#364B3D', lineHeight: 23 }, notice: { color: '#856443', fontSize: 11, lineHeight: 18, marginTop: 19 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }, navButton: { padding: 13, backgroundColor: '#E6EEDC', borderRadius: 12 },
  disabled: { opacity: 0.35 }, dots: { color: '#34704F' },
});
