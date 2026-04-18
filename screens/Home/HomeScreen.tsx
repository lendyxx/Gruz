import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { Colors } from '../../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

function formatRub(v: number) {
  return `${v.toLocaleString('ru-RU')} ₽`;
}

function statusLabel(s: string) {
  switch (s) {
    case 'created':
      return 'Создан';
    case 'pickup':
      return 'Забор груза';
    case 'enroute':
      return 'В пути';
    case 'delivered':
      return 'Доставлен';
    case 'cancelled':
      return 'Отменён';
    default:
      return s;
  }
}

export function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const { activeOrder } = useOrders();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Здравствуйте, {user?.name ?? 'Гость'}!</Text>
            <Text style={styles.sub}>Быстрый заказ грузоперевозки за пару минут.</Text>
          </View>
          <Text style={styles.logout} onPress={() => signOut()}>
            Выйти
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="📦  ЗАКАЗАТЬ ПЕРЕВОЗКУ"
            onPress={() => navigation.navigate('SelectTeam')}
          />
          <PrimaryButton
            title="🧾  ИСТОРИЯ ЗАКАЗОВ"
            onPress={() => navigation.getParent()?.navigate('HistoryTab' as never)}
            style={{ backgroundColor: '#111111' }}
          />
        </View>

        {activeOrder ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Активный заказ №{activeOrder.number}</Text>
            <Text style={styles.cardSub}>
              {statusLabel(activeOrder.status)} • {formatRub(activeOrder.totalRub)}
            </Text>
            <View style={{ height: 10 }} />
            <Text style={styles.cardLine}>Откуда: {activeOrder.cargo.fromAddress}</Text>
            <Text style={styles.cardLine}>Куда: {activeOrder.cargo.toAddress}</Text>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Нет активных заказов</Text>
            <Text style={styles.cardSub}>Создайте новый заказ — и он появится здесь.</Text>
          </Card>
        )}

        <Text
          style={styles.debug}
          onPress={() => Alert.alert('Подсказка', 'Вы можете заказать перевозку/Посмотреть историю заказов.')}
        >
          О приложении
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 20, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hello: { fontSize: 24, fontWeight: '800', color: Colors.text },
  sub: { marginTop: 6, fontSize: 13, color: Colors.muted },
  logout: { color: Colors.accent, fontWeight: '800', paddingTop: 6 },
  actions: { gap: 12 },
  card: { marginTop: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  cardSub: { marginTop: 6, fontSize: 13, color: Colors.muted },
  cardLine: { marginTop: 4, fontSize: 13, color: Colors.text },
  debug: { marginTop: 'auto', textAlign: 'center', color: Colors.muted, fontSize: 12 },
});

