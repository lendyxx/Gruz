import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../theme/colors';
import { useOrders } from '../../context/OrdersContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import type { CargoDetails } from '../../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'PriceCalculation'>;

function calcPriceDetails(team: any, cargo: CargoDetails) {
  let total = team.pricePerHour;

  // Доп. услуги
  if (cargo.needsPacking) total += 500;
  if (cargo.needsFloors) total += 400;

  // Размер груза (коэффициент)
  const volume = (cargo.widthCm ?? 0) * (cargo.heightCm ?? 0) * (cargo.lengthCm ?? 0);
  if (volume > 2000000) total += 1000; // Очень большой
  else if (volume > 1000000) total += 500; // Большой

  // Вес
  if ((cargo.weightKg ?? 0) > 100) total += 300;

  // Этажи без лифта
  if (cargo.needsFloors && !cargo.hasElevator) {
    const floors = Math.max(0, (cargo.floorTo ?? 1) - (cargo.floorFrom ?? 1));
    if (floors > 3) total += floors * 100;
  }

  // Срочность (если сегодня)
  const today = new Date().toISOString().split('T')[0];
  if (cargo.deliveryDate === today) total += 1000;

  return { total, items: [] };
}

export function PriceCalculationScreen({ route, navigation }: Props) {
  const { cargo } = route.params;
  const { selectedTeam, createOrder, clearSelectedTeam } = useOrders();

  const priceInfo = useMemo(
    () => (selectedTeam ? calcPriceDetails(selectedTeam, cargo) : { total: 0, items: [] }),
    [selectedTeam, cargo]
  );

  async function onConfirm() {
    if (!selectedTeam) return;

    try {
      console.log('Creating order with cargo:', cargo);
      const order = await createOrder({
        team: selectedTeam,
        cargo,
      });
      console.log('Order created successfully:', order);
      clearSelectedTeam();
      Alert.alert('Готово', `Заказ №${order.number} создан`, [
        {
          text: 'OK',
          onPress: () => navigation.getParent()?.navigate('HistoryTab'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating order:', error.message);
      Alert.alert('Ошибка', error.message || 'Не удалось создать заказ. Попробуйте снова.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Расчёт стоимости</Text>

        {/* Вариант */}
        <View style={styles.block}>
          <Text style={styles.label}>Бригада</Text>
          <Text style={styles.value}>
            {selectedTeam?.title} • {selectedTeam?.subtitle}
          </Text>
        </View>

        {/* Параметры груза */}
        <View style={styles.block}>
          <Text style={styles.label}>Габариты</Text>
          <Text style={styles.value}>
            {cargo.widthCm} см × {cargo.heightCm} см × {cargo.lengthCm} см
          </Text>
          {cargo.weightKg && (
            <Text style={styles.value}>Вес: {cargo.weightKg} кг</Text>
          )}
        </View>

        {/* Маршрут */}
        <View style={styles.block}>
          <Text style={styles.label}>Маршрут</Text>
          <Text style={styles.value}>От: {cargo.fromAddress}</Text>
          <Text style={styles.value}>До: {cargo.toAddress}</Text>
        </View>

        {/* Дата и время */}
        <View style={styles.block}>
          <Text style={styles.label}>Доставка</Text>
          <Text style={styles.value}>
            {cargo.deliveryDate} в {cargo.deliveryTime}
          </Text>
        </View>

        {/* Услуги */}
        {(cargo.needsPacking || cargo.needsFloors) && (
          <View style={styles.block}>
            <Text style={styles.label}>Услуги</Text>
            {cargo.needsPacking && (
              <Text style={styles.value}>✓ Упаковка</Text>
            )}
            {cargo.needsFloors && (
              <Text style={styles.value}>
                ✓ Разнос по этажам (этаж {cargo.floorFrom} - {cargo.floorTo})
                {!cargo.hasElevator && ' без лифта'}
              </Text>
            )}
          </View>
        )}

        {/* Примечания */}
        {cargo.notes && (
          <View style={styles.block}>
            <Text style={styles.label}>Примечания</Text>
            <Text style={styles.value}>{cargo.notes}</Text>
          </View>
        )}

        {/* Цена */}
        <View style={[styles.block, styles.priceBlock]}>
          <Text style={styles.priceLabel}>Стоимость доставки</Text>
          <Text style={styles.price}>{priceInfo.total} ₽</Text>
        </View>

        <PrimaryButton title="ПОДТВЕРДИТЬ И ЗАКАЗАТЬ" onPress={onConfirm} />
        <PrimaryButton
          title="ВЕРНУТЬСЯ"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 28 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  block: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  priceBlock: {
    alignItems: 'center',
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.accent,
  },
  backButton: {
    marginTop: 4,
  },
});
