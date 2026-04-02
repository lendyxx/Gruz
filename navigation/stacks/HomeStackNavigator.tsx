import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import { SelectTeamScreen } from '../../screens/SelectTeam/SelectTeamScreen';
import { CargoDetailsScreen } from '../../screens/CargoDetails/CargoDetailsScreen';
import type { HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
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
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
      <Stack.Screen
        name="SelectTeam"
        component={SelectTeamScreen}
        options={{ title: 'Выбор бригады' }}
      />
      <Stack.Screen
        name="CargoDetails"
        component={CargoDetailsScreen}
        options={{ title: 'Параметры груза' }}
      />
    </Stack.Navigator>
  );
}

