import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import type { CargoDetails, Order, OrderStatus, TeamOption, TeamOptionId } from '../types';

export const TEAM_OPTIONS: TeamOption[] = [
  { id: 'standard', title: 'Стандарт', subtitle: '2 грузчика + Газель', pricePerHour: 2000 },
  { id: 'premium', title: 'Премиум', subtitle: '4 грузчика + Газель Next', pricePerHour: 3500 },
  { id: 'office', title: 'Офисный', subtitle: '1 грузчик + микроавтобус', pricePerHour: 2500 },
];

type OrdersState = {
  isReady: boolean;
  selectedTeam: TeamOption | null;
  orders: Order[];
  activeOrder: Order | null;
  selectTeam: (teamId: TeamOptionId) => void;
  clearSelectedTeam: () => void;
  createOrder: (args: { team: TeamOption; cargo: CargoDetails }) => Promise<Order>;
  setActiveStatus: (status: OrderStatus) => Promise<void>;
  cancelActive: () => Promise<void>;
};

const OrdersContext = createContext<OrdersState | null>(null);

function calcPriceRub(team: TeamOption, cargo: CargoDetails): number {
  // Заглушка: 1 час + доп. услуги
  const base = team.pricePerHour;
  const extras = (cargo.needsPacking ? 500 : 0) + (cargo.needsFloors ? 400 : 0);
  return base + extras;
}

function byCreatedDesc(a: Order, b: Order) {
  return b.createdAt.localeCompare(a.createdAt);
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    console.log('OrdersProvider useEffect: user=', user);
    if (!user) {
      setOrders([]);
      setActiveOrderId(null);
      setIsReady(true);
      return;
    }

    // Подписка на заказы пользователя
    const q = query(collection(db, 'orders'), where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('Orders onSnapshot: docs count=', querySnapshot.size);
      const userOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        userOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(userOrders);
      // Найти активный заказ (последний с статусом не delivered/cancelled)
      const active = userOrders.find(o => !['delivered', 'cancelled'].includes(o.status)) || null;
      setActiveOrderId(active?.id || null);
      setIsReady(true);
      console.log('Orders isReady=true');
    }, (error) => {
      console.error('Orders snapshot error:', error);
      setIsReady(true);
    });

    return unsubscribe;
  }, [user]);

  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return orders.find((o) => o.id === activeOrderId) ?? null;
  }, [orders, activeOrderId]);

  const value = useMemo<OrdersState>(() => {
    return {
      isReady,
      selectedTeam,
      orders,
      activeOrder,
      selectTeam(teamId) {
        const t = TEAM_OPTIONS.find((x) => x.id === teamId) ?? null;
        setSelectedTeam(t);
      },
      clearSelectedTeam() {
        setSelectedTeam(null);
      },
      async createOrder({ team, cargo }) {
        if (!user) throw new Error('User not authenticated');
        // Получить следующий номер
        const lastOrder = orders[0]; // Отсортировано по desc
        const nextNumber = lastOrder ? lastOrder.number + 1 : 101;
        const orderData = {
          number: nextNumber,
          createdAt: new Date().toISOString(),
          status: 'created' as OrderStatus,
          team,
          cargo,
          totalRub: calcPriceRub(team, cargo),
          userId: user.id,
        };
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        const newOrder: Order = { id: docRef.id, ...orderData };
        // Orders обновятся через onSnapshot
        setActiveOrderId(newOrder.id);
        return newOrder;
      },
      async setActiveStatus(status) {
        if (!activeOrderId) return;
        await updateDoc(doc(db, 'orders', activeOrderId), { status });
        // Orders обновятся через onSnapshot
      },
      async cancelActive() {
        if (!activeOrderId) return;
        await updateDoc(doc(db, 'orders', activeOrderId), { status: 'cancelled' });
        setActiveOrderId(null);
      },
    };
  }, [isReady, selectedTeam, orders, activeOrder, user]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}

