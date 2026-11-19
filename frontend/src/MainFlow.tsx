import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, ApiError } from './api';
import { CATEGORY_LABELS, PRESET_INGREDIENTS } from './catalog';
import { addRestriction, validCoordinates } from './profileRules';
import { RecommendationCards } from './RecommendationCards';
import type { Category, MenuCard, Profile, Recommendations, Restriction, RestrictionType, Selection, Session } from './types';
type Screen = 'PREFERENCES' | 'RESTRICTIONS' | 'HOME' | 'RECOMMENDATIONS' | 'SELECTED';
export function MainFlow({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [screen, setScreen] = useState<Screen>(session.destination === 'ONBOARDING' ? 'PREFERENCES' : 'HOME');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Restriction[]>([]);
  const [type, setType] = useState<RestrictionType>('ALLERGY');
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const [initialError, setInitialError] = useState('');
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [lat, setLat] = useState('37.5665');
  const [lng, setLng] = useState('126.9780');
  const lock = useRef(false);
  const token = session.accessToken;
  const logoutRef = useRef(onLogout);
  logoutRef.current = onLogout;
  useEffect(() => {
    let active = true;
    setInitializing(true); setInitialError('');
    api.profile(token).then(saved => {
      if (!active) return;
      setProfile(saved); setCategories(saved.preferences); setItems(saved.restrictions);
      if (session.destination === 'ONBOARDING')
        setScreen(saved.onboardingCompleted ? 'HOME' : saved.preferences.length ? 'RESTRICTIONS' : 'PREFERENCES');
    }).catch(e => {
      if (!active) return;
      if (e instanceof ApiError && e.status === 401) { void logoutRef.current(); return; }
      setInitialError(e instanceof Error ? e.message : '설정을 불러오지 못했습니다.');
    }).finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, [token, reload, session.destination]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (e) {
      if (e instanceof ApiError && e.status === 401) { await logoutRef.current(); return; }
      setError(e instanceof Error ? e.message : '요청을 처리하지 못했습니다.');
    } finally { lock.current = false; setBusy(false); }
  }
  function go(next: Screen) { if (!lock.current) { setError(''); setScreen(next); } }
  function add(raw: string) {
    if (lock.current) return;
    try { setItems(addRestriction(items, raw, type)); setCustom(''); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : '등록하지 못했습니다.'); }
  }
  async function savePreferences() {
    if (!categories.length) { setError('선호 카테고리를 1개 이상 선택해 주세요.'); return; }
    await run(async () => { const saved = await api.preferences(token, categories); setProfile(saved); setCategories(saved.preferences); setRecommendations(null); setScreen('RESTRICTIONS'); });
  }
  async function saveRestrictions(skip = false) {
    if (skip && items.length) { setError('등록한 항목이 있습니다. 삭제하거나 저장해 주세요.'); return; }
    if (!skip && custom.trim()) { setError('직접 입력한 식재료를 먼저 추가하거나 입력란을 비워 주세요.'); return; }
    await run(async () => {
      const saved = await api.restrictions(token, skip ? [] : items); setProfile(saved); setItems(saved.restrictions);
      setCustom(''); setRecommendations(null); setScreen('HOME');
    });
  }
  async function recommend() {
    if (!validCoordinates(lat, lng)) { setError('유효한 위도(-90~90)와 경도(-180~180)를 입력해 주세요.'); return; }
    await run(async () => { setRecommendations(null); const data = await api.recommendations(token, Number(lat), Number(lng)); setRecommendations(data); setScreen('RECOMMENDATIONS'); });
  }
  async function choose(item: MenuCard) {
    if (!recommendations) return;
    await run(async () => { const chosen = await api.select(token, recommendations.sessionId, item.menuId); setSelection(chosen); setScreen('SELECTED'); });
  }
  const button = (text: string, action: () => void, secondary = false, disabled = false) => <Pressable
    accessibilityRole="button" accessibilityLabel={text} disabled={busy || disabled} onPress={action}
    style={[s.button, secondary && s.secondary, (busy || disabled) && s.dim]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{text}</Text></Pressable>;
  const chip = (key: string, label: string, selected: boolean, action: () => void) => <Pressable key={key}
    accessibilityRole="checkbox" accessibilityState={{ checked: selected }} disabled={busy} onPress={action} style={[s.chip, selected && s.selectedChip]}>
    <Text style={[s.chipText, selected && s.selectedChipText]}>{label}</Text></Pressable>;
  if (initializing) return <SafeAreaView style={s.center}><ActivityIndicator color="#34704F" /><Text style={s.hint}>저장된 취향을 불러오고 있어요.</Text></SafeAreaView>;
  if (initialError) return <SafeAreaView style={s.page}><View style={s.body}><Text style={s.title}>설정을 불러오지 못했어요</Text><Text style={s.error}>{initialError}</Text>
    {button('다시 시도', () => setReload(n => n + 1))}{button('로그아웃', () => { void onLogout(); }, true)}</View></SafeAreaView>;
  return <SafeAreaView style={s.page}><StatusBar style="dark" />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
      <View style={s.header}><Text style={s.brand}>오늘 한 끼</Text><Pressable disabled={busy} onPress={() => { void onLogout(); }} accessibilityRole="button"><Text style={s.link}>로그아웃</Text></Pressable></View>
      <Text style={s.account}>{session.user.email}</Text>
      {screen === 'PREFERENCES' && <>
        <Text style={s.step}>STEP 01 / 02 · US-02</Text><Text style={s.title}>어떤 음식을
좋아하세요?</Text>
        <Text style={s.description}>1개 이상 선택해 주세요. 선택한 카테고리를 추천 순위에 우선 반영해요.</Text>
        <View style={s.wrap}>{(Object.keys(CATEGORY_LABELS) as Category[]).map(c => chip(c, CATEGORY_LABELS[c], categories.includes(c), () => setCategories(old => old.includes(c) ? old.filter(x => x !== c) : [...old, c])))}</View>
        {button('저장하고 다음', () => { void savePreferences(); })}
        {profile?.onboardingCompleted && button('홈으로', () => { setCategories(profile.preferences); go('HOME'); }, true)}
      </>}
      {screen === 'RESTRICTIONS' && <>
        <Text style={s.step}>STEP 02 / 02 · US-03</Text><Text style={s.title}>못 먹는 재료가
있나요?</Text>
        <Text style={s.description}>알레르기와 비선호 모두 추천에서 제외해요. 목록에서 고르거나 직접 입력하세요.</Text>
        <View style={s.wrap}>{chip('ALLERGY', '알레르기', type === 'ALLERGY', () => setType('ALLERGY'))}{chip('DISLIKE', '비선호', type === 'DISLIKE', () => setType('DISLIKE'))}</View>
        <Text style={s.label}>사전 정의 목록 · 누르면 추가</Text>
        <View style={s.wrap}>{PRESET_INGREDIENTS.map(i => <Pressable key={i} disabled={busy} onPress={() => add(i)} style={s.preset} accessibilityRole="button"><Text style={s.chipText}>+ {i}</Text></Pressable>)}</View>
        <Text style={s.label}>직접 입력</Text><View style={s.inline}><TextInput value={custom} editable={!busy} onChangeText={setCustom} placeholder="예: 고수" accessibilityLabel="식재료 직접 입력" style={[s.input, { flex: 1 }]} maxLength={100} onSubmitEditing={() => add(custom)} />
          <Pressable disabled={busy} onPress={() => add(custom)} style={s.add} accessibilityRole="button"><Text style={s.buttonText}>추가</Text></Pressable></View>
        <Text style={s.label}>등록할 식재료 {items.length}개</Text>
        {items.map(item => <View key={item.ingredientName} style={s.item}><View style={{ flex: 1 }}><Text style={s.itemName}>{item.ingredientName}</Text><Text style={s.hint}>{item.type === 'ALLERGY' ? '알레르기' : '비선호'}</Text></View>
          <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`${item.ingredientName} 삭제`} onPress={() => setItems(old => old.filter(i => i.ingredientName !== item.ingredientName))}><Text style={s.link}>삭제</Text></Pressable></View>)}
        {!items.length && <Text style={s.hint}>등록된 항목이 없어요. 건너뛰어도 괜찮아요.</Text>}
        {button('저장하고 홈으로', () => { void saveRestrictions(); })}
        {button('등록 없이 건너뛰기', () => { void saveRestrictions(true); }, true, items.length > 0 || !!custom.trim())}
        {button('선호 카테고리로 돌아가기', () => { setCustom(''); go('PREFERENCES'); }, true)}
      </>}
      {screen === 'HOME' && <>
        <Text style={s.step}>나에게 맞는 세 가지 메뉴</Text><Text style={s.title}>오늘은 무엇을
먹을까요?</Text>
        <View style={s.panel}><Text style={s.label}>저장된 선호</Text><Text style={s.summary}>{profile?.preferences.map(c => CATEGORY_LABELS[c]).join(' · ') || '아직 설정하지 않았어요'}</Text>
          <Text style={s.label}>추천에서 제외할 식재료</Text><Text style={s.summary}>{profile?.restrictions.map(i => i.ingredientName).join(' · ') || '없음'}</Text></View>
        <Text style={s.label}>시연 기준 좌표 · 실제 내 위치가 아닙니다</Text>
        <Text style={s.hint}>demo 프로필의 가상 데이터는 서울시청 인근 좌표에 있어요. US-05 GPS·외부 식당 API는 미구현입니다.</Text>
        <TextInput value={lat} editable={!busy} onChangeText={setLat} placeholder="위도" accessibilityLabel="기준 위도" keyboardType="numbers-and-punctuation" style={s.input} />
        <TextInput value={lng} editable={!busy} onChangeText={setLng} placeholder="경도" accessibilityLabel="기준 경도" keyboardType="numbers-and-punctuation" style={s.input} />
        {button('필터 적용 메뉴 보기', () => { void recommend(); })}
        {button('선호·제한 식재료 설정', () => { setCategories(profile?.preferences ?? []); setItems(profile?.restrictions ?? []); go('PREFERENCES'); }, true)}
      </>}
      {screen === 'RECOMMENDATIONS' && recommendations && <>
        <Text style={s.step}>US-07 · 반경 1 km 이내</Text><Text style={s.title}>이 메뉴는 어때요?</Text>
        <Text style={s.description}>{recommendations.message}</Text>
        <RecommendationCards key={recommendations.sessionId} items={recommendations.items} onSelect={item => { void choose(item); }} disabled={busy} />
        <Text style={s.hint}>식당·메뉴 정보가 완전하다고 표시된 후보만 추천합니다. 실제 안전을 보증하지 않습니다.</Text>
        {button('홈으로 돌아가기', () => go('HOME'), true)}
      </>}
      {screen === 'SELECTED' && selection && <>
        <Text style={s.step}>US-08 · 선택 완료</Text><Text style={s.title}>오늘은 이 메뉴로 결정!</Text>
        <View style={s.panel}><Text style={s.label}>선택한 메뉴</Text><Text style={s.summary}>{selection.menuName}</Text>
          <Text style={s.label}>식당</Text><Text style={s.summary}>{selection.restaurantName}</Text></View>
        <Text style={s.hint}>식당 상세 정보와 지도 연결은 다음 단계(US-11)에서 이어집니다.</Text>
        {button('홈으로 돌아가기', () => go('HOME'), true)}
      </>}
      {busy && <ActivityIndicator color="#34704F" style={{ marginTop: 16 }} />}
      {!!error && <Text style={s.error} accessibilityRole="alert">{error}</Text>}
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F8F3' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8F3' },
  body: { padding: 24, paddingTop: 30, paddingBottom: 50, width: '100%', maxWidth: 540, alignSelf: 'center', flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontWeight: '800', fontSize: 21, color: '#24523A' },
  account: { color: '#718072', fontSize: 12, marginTop: 10, marginBottom: 28 }, link: { color: '#34704F', fontWeight: '700', padding: 8 },
  step: { color: '#5B7B58', fontSize: 12, fontWeight: '700', marginBottom: 15 }, title: { fontSize: 29, lineHeight: 40, fontWeight: '800', color: '#203D2B', marginBottom: 13 },
  description: { color: '#647467', lineHeight: 23, fontSize: 14, marginBottom: 23 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 20 },
  chip: { borderColor: '#D6E0D1', borderWidth: 1, backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 13, paddingHorizontal: 18 },
  selectedChip: { borderColor: '#34704F', backgroundColor: '#34704F' }, chipText: { color: '#3C5945', fontSize: 14 }, selectedChipText: { color: '#FFFFFF', fontWeight: '700' },
  button: { backgroundColor: '#34704F', borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 13 }, buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondary: { backgroundColor: '#E6EEDC' }, secondaryText: { color: '#24523A' }, dim: { opacity: 0.45 },
  label: { color: '#3C5945', fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 14 }, hint: { color: '#778277', fontSize: 12, lineHeight: 20, marginTop: 5, marginBottom: 8 },
  preset: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 14, backgroundColor: '#E9EFE4' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D7E1D2', padding: 14, borderRadius: 12, marginBottom: 10, color: '#233D2B', fontSize: 15 },
  inline: { flexDirection: 'row', gap: 10 }, add: { backgroundColor: '#34704F', borderRadius: 12, paddingHorizontal: 18, height: 50, justifyContent: 'center' },
  item: { padding: 13, backgroundColor: '#FFFFFF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, itemName: { fontWeight: '700', color: '#284833', fontSize: 15 },
  error: { color: '#AE3D30', backgroundColor: '#FBEBE6', padding: 13, borderRadius: 12, lineHeight: 22, marginTop: 18 }, panel: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 }, summary: { color: '#4D6655', lineHeight: 24, marginBottom: 8 },
});
