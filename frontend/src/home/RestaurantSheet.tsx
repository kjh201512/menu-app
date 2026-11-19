import React from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { assetUrl } from '../api';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '../catalog';
import { C } from '../theme';
import type { MenuView, NearbyRestaurant, RestaurantDetail, Selection } from '../types';
import { StatusBadge } from './StatusBadge';

type Props = {
  visible: boolean;
  detail: RestaurantDetail | null;
  item: NearbyRestaurant | null;
  selection: Selection | null;
  onClose: () => void;
};

export function RestaurantSheet({ visible, detail, item, selection, onClose }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  if (!detail) return null;
  const uri = assetUrl(detail.imageUrl);
  const menus: MenuView[] = item?.menus ?? detail.signatureMenus.map((name, i) => ({ menuId: -(i + 1), name, price: 0 }));
  const distance = detail.distanceMeters != null ? `${detail.distanceMeters.toLocaleString()} m · 직선거리` : '정보 없음';

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={[s.backdrop, wide ? s.center : s.bottom]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
      <View style={[s.sheet, wide ? s.sheetWide : s.sheetNarrow]}>
        <ScrollView>
          {uri ? <Image source={{ uri }} style={s.photo} resizeMode="cover" />
            : <View style={[s.photo, s.photoEmpty]}><Text style={s.photoEmoji}>{CATEGORY_EMOJI[detail.category]}</Text></View>}
          <View style={s.body}>
            {selection && <View style={s.picked}>
              <Text style={s.pickedText}>✓ 오늘의 메뉴로 ‘{selection.menuName}’을(를) 골랐어요</Text>
            </View>}
            <View style={s.titleRow}>
              <Text style={s.name}>{detail.name}</Text>
              <StatusBadge status={detail.openStatus} label={detail.openStatusLabel} />
            </View>
            <Text style={s.meta}>{CATEGORY_LABELS[detail.category]}</Text>
            <View style={s.infoBox}>
              <View style={s.info}><Text style={s.infoLabel}>영업시간</Text><Text style={s.infoValue}>{detail.businessHours ?? '정보 없음'}</Text></View>
              <View style={s.info}><Text style={s.infoLabel}>거리</Text><Text style={s.infoValue}>{distance}</Text></View>
            </View>
            <Text style={s.menuTitle}>메뉴</Text>
            {menus.length === 0 && <Text style={s.emptyText}>정보 없음</Text>}
            {menus.map(m => {
              const picked = selection?.menuId === m.menuId;
              return <View key={m.menuId} style={[s.menuRow, picked && s.menuRowPicked]}>
                <Text style={[s.menuName, picked && s.menuNamePicked]}>{m.name}{picked ? '  ✓' : ''}</Text>
                {m.price > 0 && <Text style={s.menuPrice}>{m.price.toLocaleString()}원</Text>}
              </View>;
            })}
            {item && item.hiddenMenuCount > 0 && <Text style={s.hidden}>제외 재료가 들어간 메뉴 {item.hiddenMenuCount}개는 숨겼어요.</Text>}
            <Text style={s.notice}>등록된 식재료 기준 필터 결과예요. 실제 알레르겐·교차오염은 가게에 꼭 확인하세요.</Text>
            <View style={s.actions}>
              <Pressable style={({ pressed }) => [s.primary, pressed && s.dim]} accessibilityRole="button"
                onPress={() => { void Linking.openURL(detail.mapUrl); }}>
                <Text style={s.primaryText}>지도 앱에서 위치 보기</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [s.secondary, pressed && s.dim]} accessibilityRole="button" onPress={onClose}>
                <Text style={s.secondaryText}>닫기</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  bottom: { justifyContent: 'flex-end', padding: 0 },
  sheet: { backgroundColor: C.surface, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  sheetWide: { width: 480, maxHeight: '90%', borderRadius: 22 },
  sheetNarrow: { width: '100%', maxHeight: '88%', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  photo: { width: '100%', height: 230, backgroundColor: C.surface2 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 64 },
  body: { padding: 22 },
  picked: { backgroundColor: C.redSoft, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.red },
  pickedText: { color: C.white, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  name: { color: C.text, fontSize: 24, fontWeight: '800' },
  meta: { color: C.sub, marginTop: 6 },
  infoBox: { backgroundColor: C.surface2, borderRadius: 14, padding: 14, marginTop: 16, gap: 10 },
  info: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: C.sub },
  infoValue: { color: C.text, fontWeight: '700' },
  menuTitle: { color: C.text, fontWeight: '800', fontSize: 16, marginTop: 22, marginBottom: 8 },
  emptyText: { color: C.sub },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  menuRowPicked: { backgroundColor: C.redSoft, paddingHorizontal: 10, borderRadius: 10, borderBottomWidth: 0 },
  menuName: { color: C.text, fontSize: 15 },
  menuNamePicked: { fontWeight: '800' },
  menuPrice: { color: C.text, fontWeight: '700' },
  hidden: { color: C.red, fontSize: 12, marginTop: 10 },
  notice: { color: C.faint, fontSize: 11, lineHeight: 18, marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  primary: { flex: 1, backgroundColor: C.red, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: C.white, fontWeight: '800' },
  secondary: { paddingHorizontal: 22, borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  secondaryText: { color: C.text, fontWeight: '700' },
  dim: { opacity: 0.7 },
});
