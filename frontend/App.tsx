import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, ApiError } from './src/api';
import { clearSession, readSession, saveSession } from './src/session';
import { normalizeEmail, validate, type FieldErrors } from './src/validation';
import type { AuthResponse, Session } from './src/types';
import { MainFlow } from './src/MainFlow';
type Mode = 'login' | 'signup';
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [pendingAuth, setPendingAuth] = useState<AuthResponse | null>(null);

  useEffect(() => {
    let active = true;
    async function restore() {
      setBooting(true); setRestoreError('');
      try {
        const saved = await readSession();
        if (saved) {
          try {
            const user = await api.me(saved.accessToken);
            if (active) setSession({ ...saved, user });
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              await clearSession();
              if (active) setMessage('인증이 만료되었습니다. 다시 로그인해 주세요.');
            } else throw error;
          }
        }
      } catch (error) {
        if (active) setRestoreError(error instanceof Error ? error.message : '저장된 로그인을 확인하지 못했습니다.');
      } finally { if (active) setBooting(false); }
    }
    void restore();
    return () => { active = false; };
  }, [restoreAttempt]);

  function switchMode(next: Mode) {
    if (lock.current) return;
    setMode(next); setPassword(''); setConfirmation(''); setFields({}); setMessage('');
    setShowPassword(false); setPendingAuth(null);
  }
  async function commitAuth(auth: AuthResponse) {
    const next: Session = { accessToken: auth.accessToken, user: auth.user, destination: auth.nextScreen };
    // 저장에 실패한 경우 메모리에만 결과를 보관하여 가입 요청을 중복 전송하지 않습니다.
    try { await saveSession(next); }
    catch { setPendingAuth(auth); setMessage('인증은 완료되었지만 안전한 저장에 실패했습니다. 아래 버튼으로 저장을 재시도해 주세요.'); return; }
    setPendingAuth(null); setPassword(''); setConfirmation(''); setSession(next);
  }
  async function submit() {
    if (lock.current) return;
    const errors = pendingAuth ? {} : validate(email, password, mode === 'signup' ? confirmation : undefined);
    setFields(errors); setMessage('');
    if (Object.keys(errors).length) return;
    lock.current = true; setBusy(true);
    try {
      const auth = pendingAuth ?? await api[mode](normalizeEmail(email), password);
      await commitAuth(auth);
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fieldErrors); setMessage(error.message);
      } else setMessage('요청을 완료하지 못했습니다. 다시 시도해 주세요.');
    } finally { lock.current = false; setBusy(false); }
  }
  async function logout() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage('');
    try { await clearSession(); setSession(null); setPassword(''); setConfirmation(''); setMode('login'); }
    catch { setMessage('로그인 정보를 지우지 못했습니다. 다시 시도해 주세요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function resetSavedLogin() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await clearSession(); setRestoreError(''); setSession(null); }
    catch { setRestoreError('저장 정보를 지우지 못했습니다. 다시 시도해 주세요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function field(label: string, value: string, onChange: (value: string) => void,
                 key: 'email' | 'password' | 'confirmation', secret = false) {
    return <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} editable={!busy && !pendingAuth}
        placeholder={key === 'email' ? 'student@example.com' : key === 'password' ? '8자 이상 입력' : '비밀번호를 한 번 더 입력'}
        placeholderTextColor="#9A9F9A" autoCapitalize="none" autoCorrect={false}
        keyboardType={key === 'email' ? 'email-address' : 'default'}
        textContentType={key === 'email' ? 'emailAddress' : mode === 'signup' ? 'newPassword' : 'password'}
        secureTextEntry={secret && !showPassword} accessibilityLabel={label}
        onSubmitEditing={() => { if (key !== 'email') void submit(); }}
        style={[styles.input, fields[key] ? styles.invalid : undefined]} />
      {!!fields[key] && <Text accessibilityRole="alert" style={styles.error}>{fields[key]}</Text>}
    </View>;
  }
  const button = (label: string, action: () => void, secondary = false) =>
    <Pressable onPress={action} disabled={busy} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, (busy || pressed) && styles.dim]}>
      {busy ? <ActivityIndicator color={secondary ? '#34704F' : '#FFFFFF'} /> :
        <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>}
    </Pressable>;

  if (booting) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#34704F" /><Text style={styles.help}>로그인 정보를 확인하고 있어요.</Text></SafeAreaView>;
  if (restoreError) return <SafeAreaView style={styles.page}><View style={styles.content}>
    <Text style={styles.title}>연결을 확인해 주세요</Text><Text style={styles.subtitle}>{restoreError}</Text>
    {button('다시 시도', () => setRestoreAttempt(n => n + 1))}
    {button('저장된 로그인 지우고 로그인 화면으로', () => { void resetSavedLogin(); }, true)}
  </View></SafeAreaView>;
  if (session) return <MainFlow session={session} onLogout={logout} />;
  return <SafeAreaView style={styles.page}><StatusBar style="dark" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Text style={styles.brand}>오늘 한 끼</Text><View style={styles.tag}><Text style={styles.tagText}>고민은 줄이고, 취향은 담고</Text></View>
      <Text style={styles.title}>{mode === 'signup' ? '나만의 한 끼를\n시작해 보세요' : '반가워요!\n오늘도 맛있는 선택'}</Text>
      <Text style={styles.subtitle}>계정에 취향을 저장하고, 다음 식사는 더 편하게.</Text>
      <View style={styles.tabs}>
        {(['login', 'signup'] as const).map(tab => <Pressable key={tab} onPress={() => switchMode(tab)}
          disabled={busy} accessibilityRole="tab" accessibilityState={{ selected: mode === tab }}
          style={[styles.tab, mode === tab && styles.activeTab]}>
          <Text style={[styles.tabText, mode === tab && styles.activeTabText]}>{tab === 'login' ? '로그인' : '회원가입'}</Text>
        </Pressable>)}
      </View>
      {field('이메일', email, setEmail, 'email')}
      {field('비밀번호', password, setPassword, 'password', true)}
      {mode === 'signup' && field('비밀번호 확인', confirmation, setConfirmation, 'confirmation', true)}
      <Pressable onPress={() => setShowPassword(value => !value)} accessibilityRole="button" style={styles.showPassword}>
        <Text style={styles.link}>{showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}</Text>
      </Pressable>
      {!!message && <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{message}</Text></View>}
      {button(pendingAuth ? '인증 정보 저장 다시 시도' : mode === 'signup' ? '가입하고 취향 설정하기' : '로그인', () => { void submit(); })}
      <Text style={styles.help}>{mode === 'signup' ? '가입 후 취향 설정 화면으로 이동합니다.' : '이메일과 비밀번호로 안전하게 로그인하세요.'}</Text>
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 }, page: { flex: 1, backgroundColor: '#F6F8F3' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8F3' },
  content: { padding: 26, paddingTop: 36, paddingBottom: 48, flexGrow: 1, width: '100%', maxWidth: 540, alignSelf: 'center' },
  brand: { color: '#24523A', fontWeight: '800', fontSize: 21, marginBottom: 28 },
  tag: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#E6EEDC', marginBottom: 18 },
  tagText: { color: '#406045', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 30, lineHeight: 41, fontWeight: '800', color: '#202F26', marginBottom: 12 },
  subtitle: { color: '#657268', fontSize: 14, lineHeight: 23, marginBottom: 25 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#DCE2D9', marginBottom: 25 },
  tab: { flex: 1, alignItems: 'center', padding: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#34704F' }, tabText: { color: '#7C867D', fontWeight: '600', fontSize: 15 },
  activeTabText: { color: '#24523A' }, field: { marginBottom: 17 },
  label: { fontSize: 13, fontWeight: '600', color: '#394B3D', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D9E0D5', borderRadius: 13, backgroundColor: '#FFFFFF', padding: 15, fontSize: 16, color: '#202F26' },
  invalid: { borderColor: '#B54136' }, error: { color: '#A63329', fontSize: 13, lineHeight: 20, marginTop: 6 },
  errorBox: { padding: 12, backgroundColor: '#FBEDE8', borderRadius: 12, marginBottom: 10 },
  showPassword: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 4, marginBottom: 7 },
  link: { color: '#34704F', fontSize: 13, fontWeight: '600' },
  button: { backgroundColor: '#34704F', borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 10, minHeight: 55 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondary: { backgroundColor: '#E6EEDC' }, secondaryText: { color: '#24523A' }, dim: { opacity: 0.6 },
  help: { marginTop: 17, color: '#69766B', fontSize: 12, lineHeight: 20, textAlign: 'center' },
  card: { borderRadius: 16, backgroundColor: '#FFFFFF', padding: 21, marginBottom: 18 }, account: { fontSize: 16, color: '#24523A' },
});
