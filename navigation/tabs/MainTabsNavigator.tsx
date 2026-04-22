import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../../theme/colors';
import { HomeStackNavigator } from '../stacks/HomeStackNavigator';
import { HistoryStackNavigator } from '../stacks/HistoryStackNavigator';
import { AdminStackNavigator } from '../stacks/AdminStackNavigator';
import { useAdmin } from '../../context/AdminContext';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? Colors.accent : Colors.muted, fontSize: 12, fontWeight: '700' }}>
      {label}
    </Text>
  );
}

export function MainTabsNavigator() {
  const { isAdmin } = useAdmin();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.card,
          height: 58,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Главная',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Главная" />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackNavigator}
        options={{
          title: 'История',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="История" />,
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="AdminTab"
          component={AdminStackNavigator}
          options={{
            title: 'Админ',
            tabBarLabel: () => null,
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Админ 👑" />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

