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

type Props = NativeStackScreenProps<HomeStackParamList, 'CargoDetails'>;

function parseOptionalNumber(s: string): number | undefined {
  const t = s.trim().replace(',', '.');
  if (!t) return undefined;
  const v = Number(t);
  if (!Number.isFinite(v)) return undefined;
  return v;
}

export function CargoDetailsScreen({ navigation }: Props) {
  const { selectedTeam, createOrder, clearSelectedTeam } = useOrders();
  const [sizeText, setSizeText] = useState('');
  const [weight, setWeight] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [needsPacking, setNeedsPacking] = useState(false);
  const [needsFloors, setNeedsFloors] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => {
    return {
      team: selectedTeam ? null : 'Сначала выберите бригаду.',
      sizeText: sizeText.trim() ? null : 'Укажите примерные габариты.',
      fromAddress: fromAddress.trim() ? null : 'Укажите адрес откуда.',
      toAddress: toAddress.trim() ? null : 'Укажите адрес куда.',
      weight: (() => {
        const v = parseOptionalNumber(weight);
        if (!weight.trim()) return null;
        if (v === undefined) return 'Вес должен быть числом.';
        if (v <= 0) return 'Вес должен быть > 0.';
        return null;
      })(),
    };
  }, [selectedTeam, sizeText, fromAddress, toAddress, weight]);

  async function onCreate() {
    if (errors.team) {
      Alert.alert('Не выбран вариант', 'Вернитесь и выберите бригаду.');
      navigation.navigate('SelectTeam');
      return;
    }
    if (errors.sizeText || errors.fromAddress || errors.toAddress || errors.weight) {
      Alert.alert('Проверьте поля', 'Исправьте ошибки и попробуйте снова.');
      return;
    }
    if (!selectedTeam) return;

    setLoading(true);
    try {
      const order = await createOrder({
        team: selectedTeam,
        cargo: {
          sizeText: sizeText.trim(),
          weightKg: parseOptionalNumber(weight),
          fromAddress: fromAddress.trim(),
          toAddress: toAddress.trim(),
          needsPacking,
          needsFloors,
        },
      });
      clearSelectedTeam();
      Alert.alert('Готово', `Заказ №${order.number} создан`, [
        {
          text: 'OK',
          onPress: () => navigation.getParent()?.navigate('HistoryTab'),
        },
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать заказ. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>
          {selectedTeam
            ? `Бригада: ${selectedTeam.title} • ${selectedTeam.subtitle}`
            : 'Бригада не выбрана'}
        </Text>

        <View style={styles.block}>
          <TextField
            label="Габариты (примерно)"
            value={sizeText}
            onChangeText={setSizeText}
            placeholder="Например: 2x1.5x1 м"
            error={errors.sizeText}
          />
          <TextField
            label="Вес (кг) — опционально"
            value={weight}
            onChangeText={setWeight}
            placeholder="Например: 120"
            keyboardType="numeric"
            error={errors.weight}
          />
        </View>

        <View style={styles.block}>
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

        <View style={styles.block}>
          <ToggleRow label="Нужна упаковка" value={needsPacking} onChange={setNeedsPacking} />
          <ToggleRow
            label="Нужен разнос по этажам"
            value={needsFloors}
            onChange={setNeedsFloors}
          />
        </View>

        <PrimaryButton title="РАССЧИТАТЬ И ЗАКАЗАТЬ" onPress={onCreate} loading={loading} />
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
});

