import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { AdminScreen } from '../../screens/Admin/AdminScreen';
import { UserDetailsScreen } from '../../screens/Admin/UserDetailsScreen';
import type { User } from '../../types';

export type AdminStackParamList = {
  AdminList: undefined;
  UserDetails: { user: User };
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStackNavigator() {
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
      <Stack.Screen name="AdminList" component={AdminScreen} options={{ title: 'Админ-панель' }} />
      <Stack.Screen
        name="UserDetails"
        component={UserDetailsScreen}
        options={({ route }) => ({
          title: route.params.user.name,
        })}
      />
    </Stack.Navigator>
  );
}
