import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User, AuthState } from '../types';

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

  async function createFallbackUserDoc(firebaseUser: FirebaseUser) {
    const fallbackLogin = firebaseUser.email?.toLowerCase() ?? firebaseUser.phoneNumber ?? firebaseUser.uid;
    const fallbackName = firebaseUser.displayName ?? (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Пользователь');
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userData = {
      name: fallbackName,
      login: normalizeLogin(fallbackLogin),
    };
    await setDoc(userDocRef, userData, { merge: true });
    return userData;
  }

  useEffect(() => {
    console.log('AuthProvider useEffect: starting onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('onAuthStateChanged: firebaseUser=', firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocPromise = getDoc(userDocRef);
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
          const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
          let userData;
          if (userDoc.exists()) {
            userData = userDoc.data();
            console.log('User set from Firestore:', userData);
          } else {
            console.log('User doc not exists; creating fallback doc');
            userData = await createFallbackUserDoc(firebaseUser);
            console.log('Fallback user doc created:', userData);
          }
          setUser({
            id: firebaseUser.uid,
            name: userData.name,
            login: userData.login,
          });
        } catch (error) {
          console.error('Error getting or creating user doc:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        console.log('No firebaseUser');
      }
      setIsReady(true);
      console.log('Auth isReady=true');
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

