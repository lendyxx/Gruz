import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { HistoryScreen } from '../../screens/History/HistoryScreen';
import type { HistoryStackParamList } from '../types';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { color: Colors.text },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Colors.bg },
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'История' }} />
    </Stack.Navigator>
  );
}

