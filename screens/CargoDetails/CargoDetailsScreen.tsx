import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { ToggleRow } from '../../components/ToggleRow';
import { useOrders } from '../../context/OrdersContext';
import { Colors } from '../../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import type { CargoDetails } from '../../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CargoDetails'>;

function parseOptionalNumber(s: string): number | undefined {
  const t = s.trim().replace(',', '.');
  if (!t) return undefined;
  const v = Number(t);
  if (!Number.isFinite(v)) return undefined;
  return v;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

export function CargoDetailsScreen({ navigation }: Props) {
  const { selectedTeam } = useOrders();
  
  // Габариты
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [length, setLength] = useState('');
  const [weight, setWeight] = useState('');
  
  // Адреса
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  
  // Дата и время
  const [deliveryDate, setDeliveryDate] = useState(getTomorrowDate());
  const [deliveryTime, setDeliveryTime] = useState('10:00');
  
  // Услуги
  const [needsPacking, setNeedsPacking] = useState(false);
  const [needsFloors, setNeedsFloors] = useState(false);
  const [floorFrom, setFloorFrom] = useState('');
  const [floorTo, setFloorTo] = useState('');
  const [hasElevator, setHasElevator] = useState(true);
  
  // Примечания
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => {
    return {
      team: selectedTeam ? null : 'Сначала выберите бригаду.',
      width: width.trim() ? null : 'Укажите ширину.',
      height: height.trim() ? null : 'Укажите высоту.',
      length: length.trim() ? null : 'Укажите длину.',
      fromAddress: fromAddress.trim() ? null : 'Укажите адрес откуда.',
      toAddress: toAddress.trim() ? null : 'Укажите адрес куда.',
      deliveryDate: deliveryDate.trim() ? null : 'Укажите дату доставки.',
      weight: (() => {
        const v = parseOptionalNumber(weight);
        if (!weight.trim()) return null;
        if (v === undefined) return 'Вес должен быть числом.';
        if (v <= 0) return 'Вес должен быть > 0.';
        return null;
      })(),
      floorFrom: (() => {
        if (!needsFloors || !floorFrom.trim()) return null;
        const v = parseOptionalNumber(floorFrom);
        if (v === undefined) return 'Должно быть число.';
        if (v < 1) return 'Этаж должен быть ≥ 1.';
        return null;
      })(),
      floorTo: (() => {
        if (!needsFloors || !floorTo.trim()) return null;
        const v = parseOptionalNumber(floorTo);
        if (v === undefined) return 'Должно быть число.';
        if (v < 1) return 'Этаж должен быть ≥ 1.';
        return null;
      })(),
    };
  }, [selectedTeam, width, height, length, fromAddress, toAddress, weight, deliveryDate, needsFloors, floorFrom, floorTo]);

  async function onNext() {
    if (errors.team) {
      Alert.alert('Не выбран вариант', 'Вернитесь и выберите бригаду.');
      navigation.navigate('SelectTeam');
      return;
    }
    
    const hasAnyError = Object.values(errors).some(err => err !== null);
    if (hasAnyError) {
      Alert.alert('Проверьте поля', 'Исправьте ошибки и попробуйте снова.');
      return;
    }

    if (!selectedTeam) return;

    const cargo: CargoDetails = {
      widthCm: parseOptionalNumber(width),
      heightCm: parseOptionalNumber(height),
      lengthCm: parseOptionalNumber(length),
      weightKg: parseOptionalNumber(weight),
      fromAddress: fromAddress.trim(),
      toAddress: toAddress.trim(),
      deliveryDate,
      deliveryTime,
      needsPacking,
      needsFloors,
      floorFrom: needsFloors ? parseOptionalNumber(floorFrom) : undefined,
      floorTo: needsFloors ? parseOptionalNumber(floorTo) : undefined,
      hasElevator,
      notes: notes.trim(),
    };

    navigation.navigate('PriceCalculation', { cargo });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>
          {selectedTeam
            ? `Бригада: ${selectedTeam.title} • ${selectedTeam.subtitle}`
            : 'Бригада не выбрана'}
        </Text>

        {/* Габариты */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Габариты</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <TextField
                label="Ширина (см)"
                value={width}
                onChangeText={setWidth}
                placeholder="50"
                keyboardType="numeric"
                error={errors.width}
              />
            </View>
            <View style={styles.col}>
              <TextField
                label="Высота (см)"
                value={height}
                onChangeText={setHeight}
                placeholder="100"
                keyboardType="numeric"
                error={errors.height}
              />
            </View>
            <View style={styles.col}>
              <TextField
                label="Длина (см)"
                value={length}
                onChangeText={setLength}
                placeholder="150"
                keyboardType="numeric"
                error={errors.length}
              />
            </View>
          </View>
          <TextField
            label="Вес (кг) — опционально"
            value={weight}
            onChangeText={setWeight}
            placeholder="50"
            keyboardType="numeric"
            error={errors.weight}
          />
        </View>

        {/* Адреса */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Адреса</Text>
          <TextField
            label="Адрес ОТКУДА"
            value={fromAddress}
            onChangeText={setFromAddress}
            placeholder="Введите адрес"
            error={errors.fromAddress}
          />
          <TextField
            label="Адрес КУДА"
            value={toAddress}
            onChangeText={setToAddress}
            placeholder="Введите адрес"
            error={errors.toAddress}
          />
        </View>

        {/* Дата и время */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Дата и время доставки</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <TextField
                label="Дата (YYYY-MM-DD)"
                value={deliveryDate}
                onChangeText={setDeliveryDate}
                placeholder="2026-04-23"
                keyboardType="default"
                error={errors.deliveryDate}
              />
            </View>
            <View style={styles.col}>
              <TextField
                label="Время (HH:MM)"
                value={deliveryTime}
                onChangeText={setDeliveryTime}
                placeholder="10:00"
                keyboardType="default"
              />
            </View>
          </View>
        </View>

        {/* Услуги */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Услуги</Text>
          <ToggleRow label="Нужна упаковка" value={needsPacking} onChange={setNeedsPacking} />
          <ToggleRow
            label="Разнос по этажам"
            value={needsFloors}
            onChange={setNeedsFloors}
          />
          {needsFloors && (
            <View style={styles.row}>
              <View style={styles.col}>
                <TextField
                  label="Этаж ОТ"
                  value={floorFrom}
                  onChangeText={setFloorFrom}
                  placeholder="1"
                  keyboardType="numeric"
                  error={errors.floorFrom}
                />
              </View>
              <View style={styles.col}>
                <TextField
                  label="Этаж ДО"
                  value={floorTo}
                  onChangeText={setFloorTo}
                  placeholder="5"
                  keyboardType="numeric"
                  error={errors.floorTo}
                />
              </View>
            </View>
          )}
          <ToggleRow label="Есть лифт" value={hasElevator} onChange={setHasElevator} />
        </View>

        {/* Примечания */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Примечания</Text>
          <TextField
            label="Дополнительная информация"
            value={notes}
            onChangeText={setNotes}
            placeholder="Например: осторожно, хрупкий груз; позвонить перед приездом"
            multiline
            numberOfLines={3}
          />
        </View>

        <PrimaryButton title="ДАЛЕЕ: РАССЧИТАТЬ ЦЕНУ" onPress={onNext} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 28 },
  note: { fontSize: 12, color: Colors.muted, textAlign: 'center' },
  block: {
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
});

