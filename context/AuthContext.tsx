import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getJSON, remove, setJSON } from '../storage/storage';
import type { User } from '../types';

const STORAGE_USER = 'gruz:user';

type AuthState = {
  user: User | null;
  isReady: boolean;
  signIn: (args: { login: string; password: string }) => Promise<{ ok: true } | { ok: false; message: string }>;
  signUp: (args: {
    name: string;
    login: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

type StoredAuth = { user: User; password: string };

const AuthContext = createContext<AuthState | null>(null);

function normalizeLogin(login: string): string {
  const t = login.trim();
  if (t.includes('@')) return t.toLowerCase();
  const digits = t.replace(/[^\d+]/g, '');
  return digits;
}

function isEmail(login: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login.trim().toLowerCase());
}

function isPhone(login: string) {
  const d = login.replace(/[^\d]/g, '');
  return d.length >= 10;
}

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getJSON<StoredAuth>(STORAGE_USER);
      setUser(stored?.user ?? null);
      setIsReady(true);
    })();
  }, []);

  const value = useMemo<AuthState>(() => {
    return {
      user,
      isReady,
      async signIn({ login, password }) {
        const stored = await getJSON<StoredAuth>(STORAGE_USER);
        const norm = normalizeLogin(login);
        if (!stored) return { ok: false, message: 'Пользователь не найден. Зарегистрируйтесь.' };
        if (normalizeLogin(stored.user.login) !== norm) return { ok: false, message: 'Неверный логин.' };
        if (stored.password !== password) return { ok: false, message: 'Неверный пароль.' };
        setUser(stored.user);
        return { ok: true };
      },
      async signUp({ name, login, password }) {
        const trimmedName = name.trim();
        const trimmedLogin = login.trim();
        if (trimmedName.length < 2) return { ok: false, message: 'Имя слишком короткое.' };
        if (!isEmail(trimmedLogin) && !isPhone(trimmedLogin))
          return { ok: false, message: 'Введите корректный телефон или email.' };
        if (password.length < 4) return { ok: false, message: 'Пароль должен быть минимум 4 символа.' };
        const newUser: User = { id: uuid(), name: trimmedName, login: normalizeLogin(trimmedLogin) };
        await setJSON<StoredAuth>(STORAGE_USER, { user: newUser, password });
        setUser(newUser);
        return { ok: true };
      },
      async signOut() {
        setUser(null);
        await remove(STORAGE_USER);
      },
    };
  }, [user, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

