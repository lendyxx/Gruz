import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriver } from '../../context/DriverContext';
import { Colors } from '../../theme/colors';
import type { Order } from '../../types';

type Tab = 'available' | 'assigned';

export function DriverScreen() {
  const { isDriver, getAvailableOrders, getMyOrders, acceptOrder, updateOrderStatus } = useDriver();
  const [tab, setTab] = useState<Tab>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isDriver) return;
    loadOrders();
  }, [isDriver, tab]);

  async function loadOrders() {
    try {
      setLoading(true);
      if (tab === 'available') {
        const orders = await getAvailableOrders();
        setAvailableOrders(orders);
      } else {
        const orders = await getMyOrders();
        setAssignedOrders(orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }

  async function onAcceptOrder(orderId: string) {
    try {
      await acceptOrder(orderId);
      Alert.alert('✅ Заказ принят!', 'Вы можете менять статус заказа', [
        {
          text: 'ОК',
          onPress: () => {
            setShowOrderModal(false);
            loadOrders();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  }

  async function onUpdateOrderStatus(orderId: string, newStatus: string) {
    try {
      setUpdatingStatus(true);
      await updateOrderStatus(orderId, newStatus);
      Alert.alert('✅ Успешно', 'Статус заказа изменен');
      setSelectedOrder(prev => (prev ? { ...prev, status: newStatus as any } : null));
      loadOrders();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  function onRejectOrder(orderId: string) {
    // Просто закрываем модаль - заказ остается в доступных
    setShowOrderModal(false);
    Alert.alert('Отклонено', 'Вы отклонили заказ');
    loadOrders();
  }

  if (!isDriver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.title}>У вас нет доступа к заказам водителей</Text>
          <Text style={styles.subtitle}>Обратитесь к администратору</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orders = tab === 'available' ? availableOrders : assignedOrders;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Доступные заказы</Text>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'available' && styles.tabActive]}
            onPress={() => setTab('available')}
          >
            <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>
              📦 Доступные ({availableOrders.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'assigned' && styles.tabActive]}
            onPress={() => setTab('assigned')}
          >
            <Text style={[styles.tabText, tab === 'assigned' && styles.tabTextActive]}>
              ✓ Мои заказы ({assignedOrders.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loading}>Загрузка...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Нет заказов</Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'available'
                ? 'Здесь появятся доступные заказы'
                : 'У вас нет принятых заказов'}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map(order => (
              <Pressable
                key={order.id}
                style={styles.orderCard}
                onPress={() => {
                  setSelectedOrder(order);
                  setShowOrderModal(true);
                }}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Заказ #{order.number}</Text>
                    <Text style={styles.orderTeam}>{order.team.title}</Text>
                  </View>
                  <Text style={styles.orderPrice}>{order.totalRub} ₽</Text>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>📍 От:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {order.cargo.fromAddress}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>📍 До:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {order.cargo.toAddress}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </Text>
                  {tab === 'available' && (
                    <Text style={styles.actionHint}>Нажмите для деталей →</Text>
                  )}
                  {tab === 'assigned' && (
                    <Text style={[styles.orderStatus, styles[`status_${order.status}`]]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal for order details */}
      <Modal
        visible={showOrderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowOrderModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Заказ #{selectedOrder?.number}</Text>
            <View style={{ width: 30 }} />
          </View>

          {selectedOrder && (
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner}>
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Информация о заказе</Text>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Команда:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.team.title}</Text>
                </View>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Стоимость:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.totalRub} ₽</Text>
                </View>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Дата создания:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedOrder.createdAt).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
              </View>

              <View style={styles.cargoSection}>
                <Text style={styles.sectionTitle}>Детали груза</Text>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>От:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.cargo.fromAddress}</Text>
                </View>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>До:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.cargo.toAddress}</Text>
                </View>
                {selectedOrder.cargo.widthCm && (
                  <View style={styles.infoPair}>
                    <Text style={styles.infoLabel}>Габариты:</Text>
                    <Text style={styles.infoValue}>
                      {selectedOrder.cargo.widthCm}×{selectedOrder.cargo.heightCm}×
                      {selectedOrder.cargo.lengthCm} см
                    </Text>
                  </View>
                )}
                {selectedOrder.cargo.weightKg && (
                  <View style={styles.infoPair}>
                    <Text style={styles.infoLabel}>Вес:</Text>
                    <Text style={styles.infoValue}>{selectedOrder.cargo.weightKg} кг</Text>
                  </View>
                )}
                {selectedOrder.cargo.deliveryDate && (
                  <View style={styles.infoPair}>
                    <Text style={styles.infoLabel}>Дата доставки:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(selectedOrder.cargo.deliveryDate).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                )}
                {selectedOrder.cargo.notes && (
                  <View style={styles.infoPair}>
                    <Text style={styles.infoLabel}>Примечания:</Text>
                    <Text style={styles.infoValue}>{selectedOrder.cargo.notes}</Text>
                  </View>
                )}
              </View>

              {tab === 'available' && (
                <View style={styles.actionButtons}>
                  <Pressable
                    style={styles.rejectButton}
                    onPress={() => onRejectOrder(selectedOrder.id)}
                  >
                    <Text style={styles.rejectButtonText}>Отклонить</Text>
                  </Pressable>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => onAcceptOrder(selectedOrder.id)}
                  >
                    <Text style={styles.acceptButtonText}>Принять заказ</Text>
                  </Pressable>
                </View>
              )}

              {tab === 'assigned' && (
                <View style={styles.statusSection}>
                  <Text style={styles.sectionTitle}>Изменить статус</Text>
                  {updatingStatus && (
                    <View style={styles.loadingCenter}>
                      <ActivityIndicator size="small" color={Colors.accent} />
                    </View>
                  )}
                  <View style={styles.statusButtons}>
                    {(['pickup', 'enroute', 'delivered', 'cancelled'] as const).map(status => (
                      <Pressable
                        key={status}
                        style={[
                          styles.statusButton,
                          selectedOrder.status === status && styles.statusButtonActive,
                        ]}
                        onPress={() => onUpdateOrderStatus(selectedOrder.id, status)}
                        disabled={updatingStatus}
                      >
                        <Text style={styles.statusButtonText}>{getStatusLabel(status)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    created: '📝 Создан',
    pickup: '🚗 В пути на забор',
    enroute: '🚚 В пути',
    delivered: '✅ Доставлен',
    cancelled: '❌ Отменен',
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  tabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  tabTextActive: {
    color: Colors.card,
  },
  content: { padding: 20, gap: 12, paddingBottom: 28 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  loading: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  orderTeam: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.muted,
    marginTop: 4,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
  },
  orderDetails: {
    backgroundColor: Colors.bg,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
  },
  detailValue: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: Colors.muted,
  },
  actionHint: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },
  orderStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  status_pickup: {
    backgroundColor: '#E3F2FD',
    color: '#0D47A1',
  },
  status_enroute: {
    backgroundColor: '#F3E5F5',
    color: '#4A148C',
  },
  status_delivered: {
    backgroundColor: '#E8F5E9',
    color: '#1B5E20',
  },
  status_cancelled: {
    backgroundColor: '#FFEBEE',
    color: '#B71C1C',
  },
  // Modal styles
  modalSafe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  modalClose: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    width: 30,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 20,
    gap: 20,
    paddingBottom: 28,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoPair: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  cargoSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  statusSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  statusButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
