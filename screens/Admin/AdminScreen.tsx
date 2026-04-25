import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAdmin } from '../../context/AdminContext';
import { Colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { User, Order } from '../../types';

type Tab = 'users' | 'orders';

export function AdminScreen() {
  const { isAdmin, setUserAsAdmin, removeUserAdmin, deleteOrder, updateOrder, getAllOrders } = useAdmin();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'users') {
      loadUsers();
    } else {
      loadOrders();
    }
  }, [isAdmin, tab]);

  async function loadUsers() {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'users'));
      const usersList: User[] = [];
      snap.forEach(doc => {
        usersList.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      setLoading(true);
      const allOrders = await getAllOrders();
      // Сортировка по дате создания (новые первыми)
      const sorted = allOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }

  async function onToggleAdmin(userId: string, currentRole: string) {
    try {
      if (currentRole === 'admin') {
        await removeUserAdmin(userId);
        Alert.alert('Успешно', 'Права администратора отозваны');
      } else {
        await setUserAsAdmin(userId);
        Alert.alert('Успешно', 'Пользователь назначен администратором');
      }
      loadUsers();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  }

  async function onDeleteOrder(orderId: string) {
    Alert.alert('Удалить заказ?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        onPress: async () => {
          try {
            await deleteOrder(orderId);
            Alert.alert('Успешно', 'Заказ удален');
            setShowOrderModal(false);
            loadOrders();
          } catch (error: any) {
            Alert.alert('Ошибка', error.message);
          }
        },
        style: 'destructive',
      },
    ]);
  }

  async function onUpdateOrderStatus(orderId: string, newStatus: string) {
    try {
      await updateOrder(orderId, { status: newStatus as any });
      Alert.alert('Успешно', 'Статус заказа изменен');
      loadOrders();
      setShowOrderModal(false);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.title}>У вас нет доступа к админ-панели</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Админ-панель</Text>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'users' && styles.tabActive]}
            onPress={() => setTab('users')}
          >
            <Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>
              👥 Пользователи ({users.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'orders' && styles.tabActive]}
            onPress={() => setTab('orders')}
          >
            <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>
              📦 Заказы ({orders.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? (
          <Text style={styles.loading}>Загрузка...</Text>
        ) : tab === 'users' ? (
          <View style={styles.usersList}>
            {users.length === 0 ? (
              <Text style={styles.empty}>Нет пользователей</Text>
            ) : (
              users.map(user => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userLogin}>{user.login}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={[styles.roleText, user.role === 'admin' && styles.adminRole]}>
                        {user.role === 'admin' ? '👑 Администратор' : 'Пользователь'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => onToggleAdmin(user.id, user.role)}
                    style={[
                      styles.actionButton,
                      user.role === 'admin' && styles.removeAdminButton,
                    ]}
                  >
                    <Text style={styles.actionButtonText}>
                      {user.role === 'admin' ? 'Отозвать' : 'Сделать админ'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.length === 0 ? (
              <Text style={styles.empty}>Нет заказов</Text>
            ) : (
              orders.map(order => (
                <Pressable
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => {
                    setSelectedOrder(order);
                    setShowOrderModal(true);
                  }}
                >
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>Заказ #{order.number}</Text>
                    <Text style={[styles.orderStatus, styles[`status_${order.status}`]]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                  <Text style={styles.orderTeam}>{order.team.title}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </Text>
                  <Text style={styles.orderPrice}>{order.totalRub} ₽</Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {tab === 'users' && (
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Возможности администратора:</Text>
            <Text style={styles.infoText}>• Управление правами пользователей</Text>
            <Text style={styles.infoText}>• Удаление и редактирование заказов</Text>
            <Text style={styles.infoText}>• Изменение статусов заказов</Text>
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
                  <Text style={styles.infoLabel}>Статус:</Text>
                  <Text style={styles.infoValue}>{getStatusLabel(selectedOrder.status)}</Text>
                </View>
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
                {selectedOrder.cargo.widthCm && (
                  <View style={styles.infoPair}>
                    <Text style={styles.infoLabel}>Габариты:</Text>
                    <Text style={styles.infoValue}>
                      {selectedOrder.cargo.widthCm}×{selectedOrder.cargo.heightCm}×{selectedOrder.cargo.lengthCm} см
                    </Text>
                  </View>
                )}
                {selectedOrder.cargo.weightKg && (
                  <View style={styles.infoPair}>
                    <Text style={styles.infoLabel}>Вес:</Text>
                    <Text style={styles.infoValue}>{selectedOrder.cargo.weightKg} кг</Text>
                  </View>
                )}
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>От:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.cargo.fromAddress}</Text>
                </View>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>До:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.cargo.toAddress}</Text>
                </View>
                {selectedOrder.cargo.notes && (
                  <View style={styles.infoPair}>
                    <Text style={styles.infoLabel}>Примечания:</Text>
                    <Text style={styles.infoValue}>{selectedOrder.cargo.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Изменить статус</Text>
                <View style={styles.statusButtons}>
                  {(['created', 'pickup', 'enroute', 'delivered', 'cancelled'] as const).map(status => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusButton,
                        selectedOrder.status === status && styles.statusButtonActive,
                      ]}
                      onPress={() => onUpdateOrderStatus(selectedOrder.id, status)}
                    >
                      <Text style={styles.statusButtonText}>{getStatusLabel(status)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                style={styles.deleteButton}
                onPress={() => onDeleteOrder(selectedOrder.id)}
              >
                <Text style={styles.deleteButtonText}>Удалить заказ</Text>
              </Pressable>
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
  loading: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 40,
  },
  empty: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 40,
  },
  usersList: {
    gap: 12,
  },
  ordersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  userLogin: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    backgroundColor: Colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  adminRole: {
    color: Colors.accent,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  actionButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeAdminButton: {
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
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
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  status_created: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
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
  orderTeam: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.muted,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  infoBlock: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
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
  deleteButton: {
    backgroundColor: Colors.danger,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
