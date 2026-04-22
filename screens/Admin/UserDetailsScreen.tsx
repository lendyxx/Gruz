import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../context/AdminContext';
import { Colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { User, Order } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  AdminTab: undefined;
  UserDetails: { user: User };
};

type Props = NativeStackScreenProps<RootStackParamList, 'UserDetails'>;

export function UserDetailsScreen({ route, navigation }: Props) {
  const { user: adminUser } = route.params;
  const { getUserOrders, deleteUser } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserOrders();
  }, []);

  async function loadUserOrders() {
    try {
      setLoading(true);
      const userOrders = await getUserOrders(adminUser.id);
      setOrders(userOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteUser() {
    Alert.alert(
      'Удалить пользователя?',
      `Это удалит пользователя "${adminUser.name}" и все его ${orders.length} заказ(ов). Это действие необратимо.`,
      [
        {
          text: 'Отмена',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              await deleteUser(adminUser.id);
              Alert.alert('Успешно', 'Пользователь и все его заказы удалены', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Ошибка', error.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Информация о пользователе */}
        <View style={styles.userCard}>
          <Text style={styles.userName}>{adminUser.name}</Text>
          <Text style={styles.userLogin}>{adminUser.login}</Text>
          <View style={styles.roleBadge}>
            <Text style={[styles.roleText, adminUser.role === 'admin' && styles.adminRole]}>
              {adminUser.role === 'admin' ? '👑 Администратор' : 'Пользователь'}
            </Text>
          </View>
        </View>

        {/* Заказы */}
        {loading ? (
          <Text style={styles.loading}>Загрузка заказов...</Text>
        ) : (
          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>Заказы ({orders.length})</Text>
            {orders.length === 0 ? (
              <Text style={styles.noOrders}>Нет заказов</Text>
            ) : (
              orders.map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>Заказ №{order.number}</Text>
                    <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                  <Text style={styles.orderInfo}>
                    {order.cargo.fromAddress} → {order.cargo.toAddress}
                  </Text>
                  <Text style={styles.orderInfo}>Бригада: {order.team.title}</Text>
                  <Text style={styles.orderPrice}>{order.totalRub} ₽</Text>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleString('ru-RU')}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Кнопка удаления */}
        <View style={styles.dangerZone}>
          <PrimaryButton
            title="УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ И ВСЕ ЗАКАЗЫ"
            onPress={onDeleteUser}
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'created':
      return Colors.muted;
    case 'pickup':
      return '#3B82F6';
    case 'enroute':
      return '#F59E0B';
    case 'delivered':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return Colors.text;
  }
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    created: 'Создан',
    pickup: 'Забирают',
    enroute: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 28 },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
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
    alignSelf: 'flex-start',
  },
  adminRole: {
    color: Colors.accent,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  loading: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  ordersSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  noOrders: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  orderStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderInfo: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 16,
  },
  orderPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
    marginTop: 4,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
  },
  dangerZone: {
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
});
