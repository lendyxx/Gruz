import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

type Mode = 'signin' | 'signup';

function validateLogin(login: string): string | null {
  const t = login.trim();
  if (!t) return 'Введите телефон или email.';
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.toLowerCase());
  const phoneDigits = t.replace(/[^\d]/g, '');
  const isPhone = phoneDigits.length >= 10;
  if (!isEmail && !isPhone) return 'Нужно: корректный телефон (≥10 цифр) или email.';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Введите пароль.';
  if (password.length < 4) return 'Минимум 4 символа.';
  return null;
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverLoginError, setServerLoginError] = useState<string | null>(null);
  const [serverPasswordError, setServerPasswordError] = useState<string | null>(null);
  const [serverCommonError, setServerCommonError] = useState<string | null>(null);

  const errors = useMemo(() => {
    return {
      name:
        mode === 'signup' ? (name.trim().length >= 2 ? null : 'Введите имя (минимум 2 символа).') : null,
      login: validateLogin(login),
      password: validatePassword(password),
      common: null as string | null,
    };
  }, [mode, name, login, password]);

  async function onContinue() {
    setServerLoginError(null);
    setServerPasswordError(null);
    setServerCommonError(null);

    const nameErr = errors.name;
    const loginErr = errors.login;
    const passErr = errors.password;
    if (nameErr || loginErr || passErr) {
      Alert.alert('Проверьте поля', 'Исправьте ошибки и попробуйте снова.');
      return;
    }
    setLoading(true);
    try {
      const res =
        mode === 'signin'
          ? await signIn({ login, password })
          : await signUp({ name, login, password });
      if (!res.ok) {
        const msg = res.message;
        if (/логин/i.test(msg)) setServerLoginError(msg);
        else if (/парол/i.test(msg)) setServerPasswordError(msg);
        else setServerCommonError(msg);
        return;
      }
      // Навигация переключится автоматически (RootNavigator) после установки user в контексте.
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Logo />
        </View>

        <View style={styles.switchRow}>
          <Pressable
            onPress={() => {
              setMode('signin');
              setServerLoginError(null);
              setServerPasswordError(null);
              setServerCommonError(null);
            }}
            style={[styles.switchBtn, mode === 'signin' && styles.switchBtnOn]}
          >
            <Text style={[styles.switchText, mode === 'signin' && styles.switchTextOn]}>Вход</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode('signup');
              setServerLoginError(null);
              setServerPasswordError(null);
              setServerCommonError(null);
            }}
            style={[styles.switchBtn, mode === 'signup' && styles.switchBtnOn]}
          >
            <Text style={[styles.switchText, mode === 'signup' && styles.switchTextOn]}>
              Регистрация
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          {mode === 'signup' && (
            <TextField
              label="Имя"
              value={name}
              onChangeText={setName}
              placeholder="Например: Андрей"
              autoCapitalize="words"
              error={errors.name}
            />
          )}

          <TextField
            label="Телефон или Email"
            value={login}
            onChangeText={(t) => {
              setLogin(t);
              setServerLoginError(null);
              setServerCommonError(null);
            }}
            placeholder="+7 999 000-00-00 или name@mail.com"
            keyboardType="default"
            error={errors.login ?? serverLoginError}
          />
          <TextField
            label="Пароль"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setServerPasswordError(null);
              setServerCommonError(null);
            }}
            placeholder="••••"
            secureTextEntry
            error={errors.password ?? serverPasswordError}
          />
          {!!serverCommonError && <Text style={styles.commonError}>{serverCommonError}</Text>}
          <PrimaryButton title="Продолжить" onPress={onContinue} loading={loading} />
          <Text style={styles.hint}>
            Данные сохраняются локально (заглушка). Можно тестировать без API.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: 18, paddingBottom: 28 },
  header: { paddingTop: 18, paddingBottom: 6 },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 6,
  },
  switchBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  switchBtnOn: { backgroundColor: Colors.accent },
  switchText: { fontSize: 14, fontWeight: '700', color: Colors.muted },
  switchTextOn: { color: '#FFFFFF' },
  form: { gap: 14 },
  commonError: { fontSize: 12, color: Colors.danger, textAlign: 'center' },
  hint: { fontSize: 12, color: Colors.muted, textAlign: 'center', marginTop: 6 },
});

