import React, { createContext, useContext, useMemo } from 'react';
import { collection, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import type { Order } from '../types';

type AdminState = {
  isAdmin: boolean;
  deleteOrder: (orderId: string) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  updateUserName: (userId: string, newName: string) => Promise<void>;
  getUserOrders: (userId: string) => Promise<Order[]>;
  getAllOrders: () => Promise<Order[]>;
  setUserAsAdmin: (userId: string) => Promise<void>;
  removeUserAdmin: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

const AdminContext = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<AdminState>(() => {
    return {
      isAdmin: user?.role === 'admin',
      async deleteOrder(orderId) {
        if (user?.role !== 'admin') throw new Error('Only admins can delete orders');
        await deleteDoc(doc(db, 'orders', orderId));
        console.log('Order deleted:', orderId);
      },
      async updateOrder(orderId, updates) {
        if (user?.role !== 'admin') throw new Error('Only admins can update orders');
        const allowedFields = ['cargo', 'status', 'totalRub', 'notes'];
        const filteredUpdates = Object.keys(updates)
          .filter(key => allowedFields.includes(key))
          .reduce((obj: any, key: string) => {
            obj[key] = (updates as any)[key];
            return obj;
          }, {});
        await updateDoc(doc(db, 'orders', orderId), filteredUpdates);
        console.log('Order updated:', orderId, filteredUpdates);
      },
      async updateUserName(userId, newName) {
        if (user?.role !== 'admin') throw new Error('Only admins can update user names');
        if (newName.trim().length < 2) throw new Error('Name must be at least 2 characters');
        await updateDoc(doc(db, 'users', userId), { name: newName.trim() });
        console.log('User name updated:', userId, newName);
      },
      async getUserOrders(userId) {
        if (user?.role !== 'admin') throw new Error('Only admins can view user orders');
        const q = query(collection(db, 'orders'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const orders: Order[] = [];
        snap.forEach(doc => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
        });
        return orders;
      },
      async getAllOrders() {
        if (user?.role !== 'admin') throw new Error('Only admins can view all orders');
        const snap = await getDocs(collection(db, 'orders'));
        const orders: Order[] = [];
        snap.forEach(doc => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
        });
        return orders;
      },
      async setUserAsAdmin(userId) {
        if (user?.role !== 'admin') throw new Error('Only admins can manage admins');
        await updateDoc(doc(db, 'users', userId), { role: 'admin' });
        console.log('User set as admin:', userId);
      },
      async removeUserAdmin(userId) {
        if (user?.role !== 'admin') throw new Error('Only admins can manage admins');
        if (userId === user.id) throw new Error('Cannot remove yourself as admin');
        await updateDoc(doc(db, 'users', userId), { role: 'user' });
        console.log('User admin role removed:', userId);
      },
      async deleteUser(userId) {
        if (user?.role !== 'admin') throw new Error('Only admins can delete users');
        if (userId === user.id) throw new Error('Cannot delete yourself');
        
        try {
          // Удалить все заказы пользователя
          const q = query(collection(db, 'orders'), where('userId', '==', userId));
          const snap = await getDocs(q);
          const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          console.log(`Deleted ${snap.size} orders for user ${userId}`);
          
          // Удалить профиль пользователя
          await deleteDoc(doc(db, 'users', userId));
          console.log('User deleted:', userId);
        } catch (error: any) {
          console.error('Error deleting user:', error.message);
          throw error;
        }
      },
    };
  }, [user]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
