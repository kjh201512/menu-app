import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { DragRow } from './DragRow';
import { assetUrl } from './api';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from './catalog';
import { C } from './theme';
import type { MenuCard } from './types';

export function RecommendationCards({ items, onSelect, disabled = false }: { items: MenuCard[]; onSelect?: (item: MenuCard) => void; disabled?: boolean }) {
  if (!items.length) return <Text style={s.empty}>표시할 메뉴가 없습니다. 알레르기 필터를 완화하지 않습니다.</Text>;
  return <DragRow contentContainerStyle={s.row}>
    {items.map((item, index) => {
      const uri = assetUrl(item.imageUrl);
      return <View key={item.menuId} style={s.card} accessible accessibilityLabel={`${item.menuName}, ${item.restaurantName}, ${item.distanceMeters}미터`}>
        <View>
          {uri ? <Image source={{ uri }} style={s.photo} resizeMode="cover" />
            : <View style={[s.photo, s.photoEmpty]}><Text style={s.emoji}>{CATEGORY_EMOJI[item.category]}</Text></View>}
          <View style={s.rank}><Text style={s.rankText}>{index + 1}</Text></View>
          {item.preferred && <View style={s.prefer}><Text style={s.preferText}>선호</Text></View>}
        </View>
        <View style={s.body}>
          <Text style={s.menu} numberOfLines={1}>{item.menuName}</Text>
          <Text style={s.restaurant} numberOfLines={1}>{item.restaurantName} · {CATEGORY_LABELS[item.category]}</Text>
          <View style={s.metaRow}>
            <Text style={s.price}>{item.price.toLocaleString()}원</Text>
            <Text style={s.distance}>{item.distanceMeters.toLocaleString()}m</Text>
          </View>
          <Text style={s.ingredients} numberOfLines={1}>{item.ingredients.join(' · ')}</Text>
          {onSelect && <Pressable accessibilityRole="button" accessibilityLabel={`${item.menuName} 선택`} disabled={disabled}
            onPress={() => onSelect(item)} style={({ pressed }) => [s.select, (disabled || pressed) && s.dim]}>
            <Text style={s.selectText}>이 메뉴로 결정</Text>
          </Pressable>}
        </View>
      </View>;
    })}
  </DragRow>;
}

const s = StyleSheet.create({
  empty: { color: C.sub, paddingVertical: 28, lineHeight: 22 },
  row: { gap: 14, paddingVertical: 4, paddingRight: 8 },
  card: { width: 236, backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  photo: { width: 236, height: 150, backgroundColor: C.surface2 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 46 },
  rank: { position: 'absolute', top: 10, left: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: C.white, fontWeight: '800', fontSize: 13 },
  prefer: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(11,11,13,0.8)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  preferText: { color: C.white, fontSize: 11, fontWeight: '700' },
  body: { padding: 14 },
  menu: { color: C.text, fontSize: 17, fontWeight: '800' },
  restaurant: { color: C.sub, fontSize: 13, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { color: C.text, fontWeight: '800', fontSize: 15 },
  distance: { color: C.red, fontWeight: '700', fontSize: 13 },
  ingredients: { color: C.faint, fontSize: 12, marginTop: 6 },
  select: { marginTop: 12, backgroundColor: C.red, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  selectText: { color: C.white, fontWeight: '800', fontSize: 14 },
  dim: { opacity: 0.6 },
});
