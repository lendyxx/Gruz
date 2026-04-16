import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User } from '../types';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Получить дополнительные данные пользователя из Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            name: userData.name,
            login: userData.login,
          });
        }
      } else {
        setUser(null);
      }
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthState>(() => {
    return {
      user,
      isReady,
      async signIn({ login, password }) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, login, password);
          return { ok: true };
        } catch (error: any) {
          return { ok: false, message: error.message };
        }
      },
      async signUp({ name, login, password }) {
        const trimmedName = name.trim();
        const trimmedLogin = login.trim();
        if (trimmedName.length < 2) return { ok: false, message: 'Имя слишком короткое.' };
        if (!isEmail(trimmedLogin) && !isPhone(trimmedLogin))
          return { ok: false, message: 'Введите корректный телефон или email.' };
        if (password.length < 4) return { ok: false, message: 'Пароль должен быть минимум 4 символа.' };
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, trimmedLogin, password);
          // Сохранить дополнительные данные в Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: trimmedName,
            login: normalizeLogin(trimmedLogin),
          });
          return { ok: true };
        } catch (error: any) {
          return { ok: false, message: error.message };
        }
      },
      async signOut() {
        try {
          await firebaseSignOut(auth);
        } catch (error) {
          console.error('Sign out error:', error);
        }
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

