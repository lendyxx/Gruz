import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthStackNavigator } from './stacks/AuthStackNavigator';
import { MainTabsNavigator } from './tabs/MainTabsNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bg,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.accent,
  },
};

export function RootNavigator() {
  const { user, isReady } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (isReady) {
      const t = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isReady]);

  console.log('RootNavigator: isReady=', isReady, 'user=', user, 'showSplash=', showSplash);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showSplash ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : user ? (
          <Stack.Screen name="Main" component={MainTabsNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

