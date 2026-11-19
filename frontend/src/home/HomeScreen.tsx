import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, ApiError, assetUrl } from '../api';
import { DragRow } from '../DragRow';
import { CATEGORY_EMOJI, CATEGORY_LABELS, CATEGORY_ORDER } from '../catalog';
import { currentPlace, DEMO_PLACE, type Place } from '../location';
import { RecommendationCards } from '../RecommendationCards';
import { C } from '../theme';
import type { Category, MenuCard, Nearby, NearbyRestaurant, Profile, Recommendations, RestaurantDetail, Selection } from '../types';
import { KakaoMap } from './KakaoMap';
import { RestaurantSheet } from './RestaurantSheet';
import { StatusBadge } from './StatusBadge';

type Props = {
  token: string;
  email: string;
  profile: Profile;
  onEditProfile: () => void;
  onLogout: () => void;
  onUnauthorized: () => void;
};

export function HomeScreen({ token, email, profile, onEditProfile, onLogout, onUnauthorized }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 980;
  const [place, setPlace] = useState<Place>(DEMO_PLACE);
  const [placeMenu, setPlaceMenu] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [nearby, setNearby] = useState<Nearby | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recRound, setRecRound] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RestaurantDetail | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const unauthorizedRef = useRef(onUnauthorized);
  unauthorizedRef.current = onUnauthorized;

  const messageOf = useCallback((e: unknown, fallback: string) => {
    if (e instanceof ApiError && e.status === 401) { unauthorizedRef.current(); return ''; }
    return e instanceof Error ? e.message : fallback;
  }, []);

  useEffect(() => {
    let active = true;
    setNearbyLoading(true); setNearbyError('');
    api.nearby(token, place.lat, place.lng, category)
      .then(data => { if (active) setNearby(data); })
      .catch(e => { if (active) setNearbyError(messageOf(e, '주변 가게를 불러오지 못했어요.')); })
      .finally(() => { if (active) setNearbyLoading(false); });
    return () => { active = false; };
  }, [token, place.lat, place.lng, category, messageOf]);

  useEffect(() => {
    let active = true;
    setRecsLoading(true);
    api.recommendations(token, place.lat, place.lng)
      .then(data => { if (active) { setRecs(data); setRecRound(n => n + 1); } })
      .catch(e => { if (active) setNotice(messageOf(e, '추천 메뉴를 불러오지 못했어요.')); })
      .finally(() => { if (active) setRecsLoading(false); });
    return () => { active = false; };
  }, [token, place.lat, place.lng, messageOf]);

  const restaurants = useMemo(
    () => (nearby?.items ?? []).filter(r => !openOnly || r.openStatus === 'OPEN'),
    [nearby, openOnly]);
  const sheetItem = nearby?.items.find(r => r.restaurantId === detail?.restaurantId) ?? null;
  const isDemoPlace = place.lat === DEMO_PLACE.lat && place.lng === DEMO_PLACE.lng;
  const restrictionNames = profile.restrictions.map(r => r.ingredientName);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setNotice('');
    try { await action(); }
    catch (e) { const m = messageOf(e, '요청을 처리하지 못했어요.'); if (m) setNotice(m); }
    finally { lock.current = false; setBusy(false); }
  }

  async function openRestaurant(id: number) {
    setSelectedId(id);
    await run(async () => {
      const info = await api.restaurant(token, id, place.lat, place.lng);
      setDetail(info); setSelection(null); setSheetOpen(true);
    });
  }

  async function choose(item: MenuCard) {
    if (!recs) return;
    await run(async () => {
      const chosen = await api.select(token, recs.sessionId, item.menuId);
      const info = await api.restaurant(token, chosen.restaurantId, place.lat, place.lng);
      setSelectedId(chosen.restaurantId); setDetail(info); setSelection(chosen); setSheetOpen(true);
    });
  }

  async function another() {
    if (!recs) return;
    await run(async () => {
      const next = await api.reject(token, recs.sessionId, place.lat, place.lng);
      setRecs(next); setRecRound(n => n + 1);
    });
  }

  async function freshRecs() {
    await run(async () => {
      const data = await api.recommendations(token, place.lat, place.lng);
      setRecs(data); setRecRound(n => n + 1);
    });
  }

  async function locate() {
    setPlaceMenu(false);
    await run(async () => { const next = await currentPlace(); setPlace(next); setSelectedId(null); });
  }

  function resetPlace() {
    setPlaceMenu(false); setPlace(DEMO_PLACE); setSelectedId(null); setNotice('');
  }

  function closeSheet() {
    const wasSelection = selection !== null;
    setSheetOpen(false); setSelection(null);
    if (wasSelection) void freshRecs();
  }

  const header = <View style={s.header}>
    <View style={s.headerLeft}>
      <Text style={s.brand}>오늘 한 끼</Text>
      <Pressable onPress={() => setPlaceMenu(v => !v)} style={s.placeButton} accessibilityRole="button" accessibilityLabel="위치 바꾸기">
        <Text style={s.placeText} numberOfLines={1}>📍 {place.label}</Text>
        <Text style={s.placeCaret}>{placeMenu ? '▴' : '▾'}</Text>
      </Pressable>
    </View>
    <View style={s.headerRight}>
      {wide && <Text style={s.email} numberOfLines={1}>{email}</Text>}
      <Pressable onPress={onEditProfile} style={s.ghost} accessibilityRole="button"><Text style={s.ghostText}>취향 설정</Text></Pressable>
      <Pressable onPress={onLogout} style={s.ghost} accessibilityRole="button"><Text style={s.ghostText}>로그아웃</Text></Pressable>
    </View>
  </View>;

  const placePanel = placeMenu && <View style={s.placeMenu}>
    <Pressable style={({ pressed }) => [s.placeOption, pressed && s.pressed]} onPress={() => { void locate(); }} accessibilityRole="button">
      <Text style={s.placeOptionTitle}>현재 위치로 찾기 (GPS)</Text>
      <Text style={s.placeOptionSub}>브라우저 위치 권한을 사용해요</Text>
    </Pressable>
    <Pressable style={({ pressed }) => [s.placeOption, pressed && s.pressed]} onPress={resetPlace} accessibilityRole="button">
      <Text style={s.placeOptionTitle}>충남대 궁동 (데모 위치)</Text>
      <Text style={s.placeOptionSub}>데모 가게 16곳이 있는 곳이에요</Text>
    </Pressable>
  </View>;

  const noticeBar = !!notice && <View style={s.notice}>
    <Text style={s.noticeText}>{notice}</Text>
    <Pressable onPress={() => setNotice('')} accessibilityRole="button"><Text style={s.noticeClose}>닫기</Text></Pressable>
  </View>;

  const categoryBar = <DragRow contentContainerStyle={s.categories}>
    {([null, ...CATEGORY_ORDER] as (Category | null)[]).map(c => {
      const active = category === c;
      return <Pressable key={c ?? 'ALL'} onPress={() => { setCategory(c); setSelectedId(null); }} style={s.category}
        accessibilityRole="tab" accessibilityState={{ selected: active }}>
        <View style={[s.categoryIcon, active && s.categoryIconActive]}>
          <Text style={s.categoryEmoji}>{c ? CATEGORY_EMOJI[c] : '🍽️'}</Text>
        </View>
        <Text style={[s.categoryText, active && s.categoryTextActive]}>{c ? CATEGORY_LABELS[c] : '전체'}</Text>
      </Pressable>;
    })}
  </DragRow>;

  const filters = <View style={s.filters}>
    <Pressable onPress={() => setOpenOnly(v => !v)} style={[s.chip, openOnly && s.chipActive]} accessibilityRole="checkbox" accessibilityState={{ checked: openOnly }}>
      <Text style={[s.chipText, openOnly && s.chipTextActive]}>영업 중만</Text>
    </Pressable>
    <Pressable onPress={onEditProfile} style={[s.chip, restrictionNames.length > 0 && s.chipActive]} accessibilityRole="button">
      <Text style={[s.chipText, restrictionNames.length > 0 && s.chipTextActive]} numberOfLines={1}>
        {restrictionNames.length
          ? `제외 재료 ${restrictionNames.length}개 · ${restrictionNames.slice(0, 3).join(', ')}${restrictionNames.length > 3 ? '…' : ''}`
          : '알레르기·비선호 설정'}
      </Text>
    </Pressable>
    {profile.preferences.length > 0 && <View style={s.chipPlain}>
      <Text style={s.chipPlainText} numberOfLines={1}>선호 {profile.preferences.map(c => CATEGORY_LABELS[c]).join('·')}</Text>
    </View>}
  </View>;

  const noMoreRecs = !recs || recs.count === 0;
  const recSection = <View style={s.section}>
    <View style={s.sectionHead}>
      <View style={s.flex}>
        <Text style={s.sectionTitle}>고객님 맞춤 추천 메뉴</Text>
        <Text style={s.sectionSub}>{recs?.message ?? '취향과 제외 재료를 반영한 메뉴예요.'}</Text>
      </View>
      <Pressable onPress={() => { void another(); }} disabled={busy || noMoreRecs}
        style={[s.refresh, (busy || noMoreRecs) && s.dim]} accessibilityRole="button" accessibilityLabel="다른 메뉴 보기">
        <Text style={s.refreshText}>↻ 다른 메뉴 보기</Text>
      </Pressable>
    </View>
    {recsLoading && !recs
      ? <ActivityIndicator color={C.red} style={s.spinner} />
      : <RecommendationCards key={`${recs?.sessionId ?? 'none'}-${recRound}`} items={recs?.items ?? []}
          onSelect={item => { void choose(item); }} disabled={busy} />}
    {recs && recs.count === 0 && <Pressable onPress={() => { void freshRecs(); }} style={s.linkButton} accessibilityRole="button">
      <Text style={s.linkText}>처음부터 다시 추천받기</Text>
    </Pressable>}
  </View>;

  const mapSection = <View style={[s.mapWrap, wide ? s.mapWide : s.mapNarrow]}>
    <KakaoMap center={{ lat: place.lat, lng: place.lng }} restaurants={restaurants} selectedId={selectedId}
      onSelect={id => { void openRestaurant(id); }} />
    <View style={s.mapBadge} pointerEvents="none">
      <Text style={s.mapBadgeText}>반경 1km · {restaurants.length}곳</Text>
    </View>
  </View>;

  const listSection = <View style={s.section}>
    <View style={s.sectionHead}>
      <View style={s.flex}>
        <Text style={s.sectionTitle}>{category ? `${CATEGORY_LABELS[category]} 가게` : '내 주변 가게'}</Text>
        <Text style={s.sectionSub}>가까운 순 · 제외 재료가 들어간 메뉴는 숨겼어요</Text>
      </View>
      {nearbyLoading && <ActivityIndicator color={C.red} />}
    </View>
    {!!nearbyError && <Text style={s.errorText}>{nearbyError}</Text>}
    {!nearbyLoading && !nearbyError && restaurants.length === 0 && <View style={s.empty}>
      <Text style={s.emptyTitle}>조건에 맞는 가게가 없어요</Text>
      <Text style={s.emptySub}>{isDemoPlace ? '카테고리나 필터를 바꿔 보세요.' : '이 위치 반경 1km에는 등록된 가게가 없어요.'}</Text>
      {!isDemoPlace && <Pressable onPress={resetPlace} style={s.linkButton} accessibilityRole="button">
        <Text style={s.linkText}>충남대 궁동으로 보기</Text>
      </Pressable>}
    </View>}
    {restaurants.map(r => <RestaurantRow key={r.restaurantId} item={r} active={r.restaurantId === selectedId}
      onPress={() => { void openRestaurant(r.restaurantId); }} />)}
  </View>;

  return <View style={s.page}>
    <StatusBar style="light" />
    {header}
    {placePanel}
    {wide
      ? <View style={s.wide}>
          <ScrollView style={s.wideLeft} contentContainerStyle={s.leftContent}>
            {noticeBar}{categoryBar}{filters}{recSection}{listSection}
          </ScrollView>
          <View style={s.wideRight}>{mapSection}</View>
        </View>
      : <ScrollView contentContainerStyle={s.narrowContent}>
          {noticeBar}{categoryBar}{filters}{mapSection}{recSection}{listSection}
        </ScrollView>}
    {busy && <View style={s.busy} pointerEvents="none"><ActivityIndicator color={C.red} /></View>}
    <RestaurantSheet visible={sheetOpen} detail={detail} item={sheetItem} selection={selection} onClose={closeSheet} />
  </View>;
}

function RestaurantRow({ item, active, onPress }: { item: NearbyRestaurant; active: boolean; onPress: () => void }) {
  const uri = assetUrl(item.imageUrl);
  return <Pressable onPress={onPress} style={({ pressed }) => [s.row, active && s.rowActive, pressed && s.pressed]}
    accessibilityRole="button" accessibilityLabel={`${item.name} 상세 보기`}>
    {uri ? <Image source={{ uri }} style={s.rowImage} resizeMode="cover" />
      : <View style={[s.rowImage, s.rowImageEmpty]}><Text style={s.rowEmoji}>{CATEGORY_EMOJI[item.category]}</Text></View>}
    <View style={s.rowBody}>
      <View style={s.rowTop}>
        <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
        <StatusBadge status={item.openStatus} label={item.openStatusLabel} />
      </View>
      <Text style={s.rowMeta} numberOfLines={1}>
        {CATEGORY_LABELS[item.category]} · {item.distanceMeters.toLocaleString()}m{item.businessHours ? ` · ${item.businessHours}` : ''}
      </Text>
      <Text style={s.rowMenus} numberOfLines={1}>{item.menus.map(m => `${m.name} ${m.price.toLocaleString()}원`).join('  ·  ')}</Text>
      {item.hiddenMenuCount > 0 && <Text style={s.rowHidden}>제외 재료로 메뉴 {item.hiddenMenuCount}개 숨김</Text>}
    </View>
  </Pressable>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.bg, gap: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  brand: { color: C.red, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  placeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.line, flexShrink: 1 },
  placeText: { color: C.text, fontWeight: '700', fontSize: 14, flexShrink: 1 },
  placeCaret: { color: C.sub, fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  email: { color: C.faint, fontSize: 12, marginRight: 6, maxWidth: 200 },
  ghost: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  ghostText: { color: C.sub, fontWeight: '700', fontSize: 13 },
  placeMenu: { marginHorizontal: 20, marginTop: 10, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.line,
    overflow: 'hidden', maxWidth: 420 },
  placeOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  placeOptionTitle: { color: C.text, fontWeight: '700', fontSize: 15 },
  placeOptionSub: { color: C.sub, fontSize: 12, marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.redSoft, borderColor: C.red, borderWidth: 1,
    borderRadius: 14, padding: 14, marginBottom: 14 },
  noticeText: { color: C.white, flex: 1, lineHeight: 20 },
  noticeClose: { color: C.white, fontWeight: '700' },
  categories: { gap: 6, paddingVertical: 6 },
  category: { alignItems: 'center', width: 68, gap: 6 },
  categoryIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.surface },
  categoryIconActive: { borderColor: C.red, backgroundColor: C.redSoft },
  categoryEmoji: { fontSize: 26 },
  categoryText: { color: C.sub, fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: C.white, fontWeight: '800' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, maxWidth: 320 },
  chipActive: { backgroundColor: C.red, borderColor: C.red },
  chipText: { color: C.sub, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: C.white },
  chipPlain: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.line, maxWidth: 320 },
  chipPlainText: { color: C.faint, fontSize: 13 },
  section: { marginTop: 26 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sectionTitle: { color: C.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionSub: { color: C.sub, fontSize: 13, marginTop: 4, lineHeight: 19 },
  refresh: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.red },
  refreshText: { color: C.red, fontWeight: '800', fontSize: 13 },
  spinner: { marginVertical: 40 },
  linkButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8 },
  linkText: { color: C.red, fontWeight: '800' },
  mapWrap: { position: 'relative' },
  mapWide: { flex: 1 },
  mapNarrow: { height: 320, marginTop: 18 },
  mapBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(11,11,13,0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  mapBadgeText: { color: C.white, fontWeight: '700', fontSize: 12 },
  errorText: { color: C.red, marginBottom: 10 },
  empty: { backgroundColor: C.surface, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: C.line },
  emptyTitle: { color: C.text, fontWeight: '800', fontSize: 16 },
  emptySub: { color: C.sub, marginTop: 6 },
  row: { flexDirection: 'row', gap: 14, padding: 12, backgroundColor: C.surface, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: C.line },
  rowActive: { borderColor: C.red },
  pressed: { opacity: 0.8 },
  rowImage: { width: 96, height: 96, borderRadius: 12, backgroundColor: C.surface2 },
  rowImageEmpty: { alignItems: 'center', justifyContent: 'center' },
  rowEmoji: { fontSize: 34 },
  rowBody: { flex: 1, justifyContent: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { color: C.text, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  rowMeta: { color: C.sub, fontSize: 12, marginTop: 6 },
  rowMenus: { color: C.text, fontSize: 13, marginTop: 8 },
  rowHidden: { color: C.red, fontSize: 11, marginTop: 6 },
  wide: { flex: 1, flexDirection: 'row' },
  wideLeft: { flex: 1, maxWidth: 680 },
  leftContent: { padding: 20, paddingBottom: 60 },
  wideRight: { flex: 1, padding: 20, paddingLeft: 0 },
  narrowContent: { padding: 16, paddingBottom: 60 },
  busy: { position: 'absolute', top: 76, right: 24, backgroundColor: C.surface, borderRadius: 999, padding: 8, borderWidth: 1, borderColor: C.line },
  dim: { opacity: 0.4 },
});
