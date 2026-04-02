import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getJSON, setJSON } from '../storage/storage';
import type { CargoDetails, Order, OrderStatus, TeamOption, TeamOptionId } from '../types';

const STORAGE_ORDERS = 'gruz:orders';
const STORAGE_ACTIVE_ID = 'gruz:activeOrderId';
const STORAGE_LAST_NUMBER = 'gruz:lastOrderNumber';

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

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function byCreatedDesc(a: Order, b: Order) {
  return b.createdAt.localeCompare(a.createdAt);
}

function seedOrders(): Order[] {
  const standard = TEAM_OPTIONS[0];
  const premium = TEAM_OPTIONS[1];
  return [
    {
      id: uuid(),
      number: 101,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      status: 'delivered',
      team: standard,
      cargo: {
        sizeText: '2x1.5x1 м',
        weightKg: 120,
        fromAddress: 'Москва, ул. Пушкина, 10',
        toAddress: 'Москва, ул. Арбат, 5',
        needsPacking: false,
        needsFloors: true,
      },
      totalRub: 2400,
    },
    {
      id: uuid(),
      number: 102,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      status: 'enroute',
      team: premium,
      cargo: {
        sizeText: '3x2x1.5 м',
        weightKg: 250,
        fromAddress: 'Москва, Ленинградский пр., 15',
        toAddress: 'Москва, Пресненская наб., 2',
        needsPacking: true,
        needsFloors: false,
      },
      totalRub: 4000,
    },
  ];
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedOrders = (await getJSON<Order[]>(STORAGE_ORDERS)) ?? null;
      const storedActive = (await getJSON<string>(STORAGE_ACTIVE_ID)) ?? null;
      const initialOrders = storedOrders && storedOrders.length ? storedOrders : seedOrders();
      setOrders(initialOrders.sort(byCreatedDesc));
      await setJSON(STORAGE_ORDERS, initialOrders);

      const maybeActive =
        storedActive && initialOrders.some((o) => o.id === storedActive) ? storedActive : null;
      setActiveOrderId(maybeActive);
      if (maybeActive) await setJSON(STORAGE_ACTIVE_ID, maybeActive);
      setIsReady(true);
    })();
  }, []);

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
        const last = (await getJSON<number>(STORAGE_LAST_NUMBER)) ?? 100;
        const nextNumber = last + 1;
        const order: Order = {
          id: uuid(),
          number: nextNumber,
          createdAt: new Date().toISOString(),
          status: 'created',
          team,
          cargo,
          totalRub: calcPriceRub(team, cargo),
        };
        const nextOrders = [order, ...orders].sort(byCreatedDesc);
        setOrders(nextOrders);
        setActiveOrderId(order.id);
        await setJSON(STORAGE_LAST_NUMBER, nextNumber);
        await setJSON(STORAGE_ACTIVE_ID, order.id);
        await setJSON(STORAGE_ORDERS, nextOrders);
        return order;
      },
      async setActiveStatus(status) {
        if (!activeOrderId) return;
        const nextOrders = orders.map<Order>((o) =>
          o.id === activeOrderId ? { ...o, status } : o
        );
        setOrders(nextOrders);
        await setJSON(STORAGE_ORDERS, nextOrders);
      },
      async cancelActive() {
        if (!activeOrderId) return;
        const nextOrders = orders.map<Order>((o) =>
          o.id === activeOrderId ? { ...o, status: 'cancelled' } : o
        );
        setOrders(nextOrders);
        setActiveOrderId(null);
        await setJSON(STORAGE_ACTIVE_ID, null);
        await setJSON(STORAGE_ORDERS, nextOrders);
      },
    };
  }, [isReady, selectedTeam, orders, activeOrder, activeOrderId]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}

