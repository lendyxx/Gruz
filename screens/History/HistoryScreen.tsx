import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useOrders } from '../../context/OrdersContext';
import { Colors } from '../../theme/colors';
import type { Order, OrderStatus } from '../../types';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatRub(v: number) {
  return `${v.toLocaleString('ru-RU')} ₽`;
}

function statusLabel(s: OrderStatus) {
  switch (s) {
    case 'created':
      return 'Создан';
    case 'pickup':
      return 'Забор груза';
    case 'enroute':
      return 'В пути';
    case 'delivered':
      return 'Выполнен';
    case 'cancelled':
      return 'Отменён';
  }
}

function statusColor(s: OrderStatus) {
  switch (s) {
    case 'delivered':
      return Colors.success;
    case 'cancelled':
      return Colors.danger;
    case 'enroute':
      return Colors.warning;
    default:
      return Colors.muted;
  }
}

function progressForStatus(s: OrderStatus) {
  if (s === 'pickup') return 0.33;
  if (s === 'enroute') return 0.66;
  if (s === 'delivered') return 1;
  return 0.12;
}

function nextStatus(s: OrderStatus): OrderStatus {
  if (s === 'created') return 'pickup';
  if (s === 'pickup') return 'enroute';
  if (s === 'enroute') return 'delivered';
  return s;
}

export function HistoryScreen() {
  const { orders, activeOrder, setActiveStatus, cancelActive } = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);

  const progress = useMemo(() => {
    if (!activeOrder) return 0;
    return progressForStatus(activeOrder.status);
  }, [activeOrder]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {activeOrder ? (
          <Card style={styles.tracking}>
            <Text style={styles.trackTitle}>Активный заказ №{activeOrder.number}</Text>
            <Text style={styles.trackSub}>Статус: {statusLabel(activeOrder.status)}</Text>
            <View style={styles.progressOuter}>
              <View style={[styles.progressInner, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <View style={styles.steps}>
              <Text style={[styles.step, activeOrder.status === 'pickup' && styles.stepOn]}>
                Забор груза
              </Text>
              <Text style={[styles.step, activeOrder.status === 'enroute' && styles.stepOn]}>В пути</Text>
              <Text style={[styles.step, activeOrder.status === 'delivered' && styles.stepOn]}>
                Доставка
              </Text>
            </View>
            <View style={styles.trackBtns}>
              <PrimaryButton
                title="Следующий шаг"
                onPress={() => setActiveStatus(nextStatus(activeOrder.status))}
                disabled={activeOrder.status === 'delivered' || activeOrder.status === 'cancelled'}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Отменить"
                onPress={cancelActive}
                style={{ flex: 1, backgroundColor: Colors.danger }}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.tracking}>
            <Text style={styles.trackTitle}>Нет активного заказа</Text>
            <Text style={styles.trackSub}>Создайте новый заказ на вкладке «Главная».</Text>
          </Card>
        )}

        <Text style={styles.listTitle}>Заказы</Text>
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
          renderItem={({ item }) => {
            return (
              <Pressable onPress={() => setSelected(item)}>
                <Card style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>№{item.number}</Text>
                    <Text style={styles.rowSub}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={[styles.badge, { color: statusColor(item.status) }]}>
                      {statusLabel(item.status)}
                    </Text>
                    <Text style={styles.sum}>{formatRub(item.totalRub)}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />

        {selected ? (
          <View style={styles.modal}>
            <Card style={styles.modalCard}>
              <Text style={styles.modalTitle}>Заказ №{selected.number}</Text>
              <Text style={styles.modalSub}>
                {formatDate(selected.createdAt)} • {statusLabel(selected.status)} • {formatRub(selected.totalRub)}
              </Text>
              <View style={{ height: 10 }} />
              <Text style={styles.modalLine}>
                Бригада: {selected.team.title} — {selected.team.subtitle}
              </Text>
              <Text style={styles.modalLine}>Откуда: {selected.cargo.fromAddress}</Text>
              <Text style={styles.modalLine}>Куда: {selected.cargo.toAddress}</Text>
              <Text style={styles.modalLine}>Габариты: {selected.cargo.sizeText}</Text>
              {typeof selected.cargo.weightKg === 'number' && (
                <Text style={styles.modalLine}>Вес: {selected.cargo.weightKg} кг</Text>
              )}
              <Text style={styles.modalLine}>
                Упаковка: {selected.cargo.needsPacking ? 'да' : 'нет'} • Этажи:{' '}
                {selected.cargo.needsFloors ? 'да' : 'нет'}
              </Text>
              <View style={{ height: 14 }} />
              <PrimaryButton title="Закрыть" onPress={() => setSelected(null)} />
            </Card>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 20, gap: 12 },
  tracking: { gap: 8 },
  trackTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  trackSub: { fontSize: 13, color: Colors.muted },
  progressOuter: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#E2E2E2',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressInner: { height: 10, backgroundColor: Colors.accent },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  step: { fontSize: 11, color: Colors.muted, fontWeight: '700' },
  stepOn: { color: Colors.accent },
  trackBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  listTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  rowSub: { marginTop: 4, fontSize: 12, color: Colors.muted },
  badge: { fontSize: 12, fontWeight: '800' },
  sum: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  modal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: { width: '100%', maxWidth: 520 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  modalSub: { marginTop: 6, fontSize: 12, color: Colors.muted },
  modalLine: { marginTop: 6, fontSize: 13, color: Colors.text },
});

