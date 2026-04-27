import React, { createContext, useContext, useMemo } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import type { Order } from '../types';

type DriverState = {
  isDriver: boolean;
  getAvailableOrders: () => Promise<Order[]>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  getMyOrders: () => Promise<Order[]>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
};

const DriverContext = createContext<DriverState | null>(null);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<DriverState>(() => {
    return {
      isDriver: user?.role === 'driver',
      async getAvailableOrders() {
        if (user?.role !== 'driver') throw new Error('Only drivers can view available orders');
        // Получаем заказы со статусом 'created' и без назначенного водителя
        const q = query(
          collection(db, 'orders'),
          where('status', '==', 'created')
        );
        const snap = await getDocs(q);
        const orders: Order[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data() as Order;
          // Показываем только заказы без назначенного водителя
          if (!data.assignedDriverId) {
            orders.push({ id: docSnap.id, ...data });
          }
        });
        return orders;
      },
      async acceptOrder(orderId) {
        if (user?.role !== 'driver') throw new Error('Only drivers can accept orders');
        if (!user?.id) throw new Error('User ID is required');
        await updateDoc(doc(db, 'orders', orderId), {
          assignedDriverId: user.id,
          status: 'pickup',
        });
        console.log('Order accepted by driver:', orderId);
      },
      async rejectOrder(orderId) {
        if (user?.role !== 'driver') throw new Error('Only drivers can reject orders');
        // Просто не принимаем заказ - он остается в статусе 'created' без assignedDriverId
        console.log('Order rejected by driver:', orderId);
      },
      async getMyOrders() {
        if (user?.role !== 'driver') throw new Error('Only drivers can view their orders');
        if (!user?.id) throw new Error('User ID is required');
        const q = query(
          collection(db, 'orders'),
          where('assignedDriverId', '==', user.id)
        );
        const snap = await getDocs(q);
        const orders: Order[] = [];
        snap.forEach(docSnap => {
          orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        return orders;
      },
      async updateOrderStatus(orderId, newStatus) {
        if (user?.role !== 'driver') throw new Error('Only drivers can update order status');
        if (!user?.id) throw new Error('User ID is required');
        await updateDoc(doc(db, 'orders', orderId), {
          status: newStatus,
        });
        console.log('Order status updated:', orderId, newStatus);
      },
    };
  }, [user]);

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver must be used within DriverProvider');
  return ctx;
}
