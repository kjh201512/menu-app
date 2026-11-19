import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, ApiError } from './api';
import { CATEGORY_EMOJI, CATEGORY_LABELS, CATEGORY_ORDER, PRESET_INGREDIENTS } from './catalog';
import { addRestriction } from './profileRules';
import { HomeScreen } from './home/HomeScreen';
import { C } from './theme';
import type { Category, Profile, Restriction, RestrictionType, Session } from './types';
type Screen = 'PREFERENCES' | 'RESTRICTIONS' | 'HOME';
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
    await run(async () => { const saved = await api.preferences(token, categories); setProfile(saved); setCategories(saved.preferences); setScreen('RESTRICTIONS'); });
  }
  async function saveRestrictions(skip = false) {
    if (skip && items.length) { setError('등록한 항목이 있습니다. 삭제하거나 저장해 주세요.'); return; }
    if (!skip && custom.trim()) { setError('직접 입력한 식재료를 먼저 추가하거나 입력란을 비워 주세요.'); return; }
    await run(async () => {
      const saved = await api.restrictions(token, skip ? [] : items); setProfile(saved); setItems(saved.restrictions);
      setCustom(''); setScreen('HOME');
    });
  }
  function editProfile() {
    setCategories(profile?.preferences ?? []); setItems(profile?.restrictions ?? []); setCustom(''); go('PREFERENCES');
  }
  const button = (text: string, action: () => void, secondary = false, disabled = false) => <Pressable
    accessibilityRole="button" accessibilityLabel={text} disabled={busy || disabled} onPress={action}
    style={[s.button, secondary && s.secondary, (busy || disabled) && s.dim]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{text}</Text></Pressable>;
  const chip = (key: string, label: string, selected: boolean, action: () => void) => <Pressable key={key}
    accessibilityRole="checkbox" accessibilityState={{ checked: selected }} disabled={busy} onPress={action} style={[s.chip, selected && s.selectedChip]}>
    <Text style={[s.chipText, selected && s.selectedChipText]}>{label}</Text></Pressable>;
  if (initializing) return <SafeAreaView style={s.center}><ActivityIndicator color={C.red} /><Text style={s.hint}>저장된 취향을 불러오고 있어요.</Text></SafeAreaView>;
  if (initialError) return <SafeAreaView style={s.page}><View style={s.body}><Text style={s.title}>설정을 불러오지 못했어요</Text><Text style={s.error}>{initialError}</Text>
    {button('다시 시도', () => setReload(n => n + 1))}{button('로그아웃', () => { void onLogout(); }, true)}</View></SafeAreaView>;
  if (screen === 'HOME' && profile) return <HomeScreen token={token} email={session.user.email} profile={profile}
    onEditProfile={editProfile} onLogout={() => { void onLogout(); }} onUnauthorized={() => { void logoutRef.current(); }} />;
  return <SafeAreaView style={s.page}><StatusBar style="light" />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
      <View style={s.header}><Text style={s.brand}>오늘 한 끼</Text><Pressable disabled={busy} onPress={() => { void onLogout(); }} accessibilityRole="button"><Text style={s.link}>로그아웃</Text></Pressable></View>
      <Text style={s.account}>{session.user.email}</Text>
      <View style={s.progress}><View style={[s.progressBar, { width: screen === 'PREFERENCES' ? '50%' : '100%' }]} /></View>
      {screen === 'PREFERENCES' && <>
        <Text style={s.step}>STEP 01 / 02</Text><Text style={s.title}>어떤 음식을{'\n'}좋아하세요?</Text>
        <Text style={s.description}>1개 이상 선택해 주세요. 선택한 카테고리를 추천 순위에 우선 반영해요.</Text>
        <View style={s.wrap}>{CATEGORY_ORDER.map(c => chip(c, `${CATEGORY_EMOJI[c]}  ${CATEGORY_LABELS[c]}`, categories.includes(c), () => setCategories(old => old.includes(c) ? old.filter(x => x !== c) : [...old, c])))}</View>
        {button('저장하고 다음', () => { void savePreferences(); })}
        {profile?.onboardingCompleted && button('홈으로', () => { setCategories(profile.preferences); go('HOME'); }, true)}
      </>}
      {screen === 'RESTRICTIONS' && <>
        <Text style={s.step}>STEP 02 / 02</Text><Text style={s.title}>못 먹는 재료가{'\n'}있나요?</Text>
        <Text style={s.description}>알레르기와 비선호 모두 추천과 지도에서 제외해요. 목록에서 고르거나 직접 입력하세요.</Text>
        <View style={s.wrap}>{chip('ALLERGY', '알레르기', type === 'ALLERGY', () => setType('ALLERGY'))}{chip('DISLIKE', '비선호', type === 'DISLIKE', () => setType('DISLIKE'))}</View>
        <Text style={s.label}>사전 정의 목록 · 누르면 추가</Text>
        <View style={s.wrap}>{PRESET_INGREDIENTS.map(i => <Pressable key={i} disabled={busy} onPress={() => add(i)} style={s.preset} accessibilityRole="button"><Text style={s.presetText}>+ {i}</Text></Pressable>)}</View>
        <Text style={s.label}>직접 입력</Text><View style={s.inline}><TextInput value={custom} editable={!busy} onChangeText={setCustom} placeholder="예: 고수" placeholderTextColor={C.faint} accessibilityLabel="식재료 직접 입력" style={[s.input, { flex: 1 }]} maxLength={100} onSubmitEditing={() => add(custom)} />
          <Pressable disabled={busy} onPress={() => add(custom)} style={s.add} accessibilityRole="button"><Text style={s.buttonText}>추가</Text></Pressable></View>
        <Text style={s.label}>등록할 식재료 {items.length}개</Text>
        {items.map(item => <View key={item.ingredientName} style={s.item}><View style={{ flex: 1 }}><Text style={s.itemName}>{item.ingredientName}</Text><Text style={s.itemType}>{item.type === 'ALLERGY' ? '알레르기' : '비선호'}</Text></View>
          <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`${item.ingredientName} 삭제`} onPress={() => setItems(old => old.filter(i => i.ingredientName !== item.ingredientName))}><Text style={s.link}>삭제</Text></Pressable></View>)}
        {!items.length && <Text style={s.hint}>등록된 항목이 없어요. 건너뛰어도 괜찮아요.</Text>}
        {button('저장하고 홈으로', () => { void saveRestrictions(); })}
        {button('등록 없이 건너뛰기', () => { void saveRestrictions(true); }, true, items.length > 0 || !!custom.trim())}
        {button('선호 카테고리로 돌아가기', () => { setCustom(''); go('PREFERENCES'); }, true)}
      </>}
      {busy && <ActivityIndicator color={C.red} style={{ marginTop: 16 }} />}
      {!!error && <Text style={s.error} accessibilityRole="alert">{error}</Text>}
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  body: { padding: 24, paddingTop: 30, paddingBottom: 50, width: '100%', maxWidth: 560, alignSelf: 'center', flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontWeight: '900', fontSize: 22, color: C.red },
  account: { color: C.faint, fontSize: 12, marginTop: 8, marginBottom: 20 }, link: { color: C.red, fontWeight: '700', padding: 8 },
  progress: { height: 4, backgroundColor: C.surface2, borderRadius: 2, marginBottom: 26, overflow: 'hidden' }, progressBar: { height: 4, backgroundColor: C.red },
  step: { color: C.red, fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 1 }, title: { fontSize: 30, lineHeight: 40, fontWeight: '800', color: C.text, marginBottom: 12 },
  description: { color: C.sub, lineHeight: 23, fontSize: 14, marginBottom: 22 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 },
  chip: { borderColor: C.line, borderWidth: 1, backgroundColor: C.surface, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18 },
  selectedChip: { borderColor: C.red, backgroundColor: C.red }, chipText: { color: C.sub, fontSize: 14, fontWeight: '600' }, selectedChipText: { color: C.white, fontWeight: '800' },
  button: { backgroundColor: C.red, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 12 }, buttonText: { color: C.white, fontWeight: '800', fontSize: 15 },
  secondary: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line }, secondaryText: { color: C.text }, dim: { opacity: 0.45 },
  label: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 12 }, hint: { color: C.sub, fontSize: 12, lineHeight: 20, marginTop: 6, marginBottom: 8 },
  preset: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line }, presetText: { color: C.text, fontSize: 13 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 14, borderRadius: 12, marginBottom: 10, color: C.text, fontSize: 15 },
  inline: { flexDirection: 'row', gap: 10 }, add: { backgroundColor: C.red, borderRadius: 12, paddingHorizontal: 18, height: 50, justifyContent: 'center' },
  item: { padding: 13, backgroundColor: C.surface, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: C.line },
  itemName: { fontWeight: '700', color: C.text, fontSize: 15 }, itemType: { color: C.sub, fontSize: 12, marginTop: 3 },
  error: { color: C.white, backgroundColor: C.redSoft, borderColor: C.red, borderWidth: 1, padding: 13, borderRadius: 12, lineHeight: 22, marginTop: 18 },
});
