import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverScreen } from '../../screens/Driver/DriverScreen';

export type DriverStackParamList = {
  DriverMain: undefined;
};

const Stack = createNativeStackNavigator<DriverStackParamList>();

export function DriverStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverMain" component={DriverScreen} />
    </Stack.Navigator>
  );
}
