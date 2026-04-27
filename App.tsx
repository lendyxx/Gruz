import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { OrdersProvider } from './context/OrdersContext';
import { AdminProvider } from './context/AdminContext';
import { DriverProvider } from './context/DriverContext';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AdminProvider>
          <DriverProvider>
            <OrdersProvider>
              <RootNavigator />
            </OrdersProvider>
          </DriverProvider>
        </AdminProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}


