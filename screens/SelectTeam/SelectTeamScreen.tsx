import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors } from '../../theme/colors';
import { TEAM_OPTIONS, useOrders } from '../../context/OrdersContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import type { TeamOptionId } from '../../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SelectTeam'>;

function formatRubPerHour(v: number) {
  return `${v.toLocaleString('ru-RU')} ₽/час`;
}

export function SelectTeamScreen({ navigation }: Props) {
  const { selectedTeam, selectTeam } = useOrders();
  const [picked, setPicked] = useState<TeamOptionId | null>(selectedTeam?.id ?? null);

  const canContinue = useMemo(() => !!picked, [picked]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Кто будет работать?</Text>
        <Text style={styles.sub}>Выберите бригаду и транспорт.</Text>

        <View style={styles.list}>
          {TEAM_OPTIONS.map((t) => {
            const on = picked === t.id;
            return (
              <Pressable key={t.id} onPress={() => setPicked(t.id)}>
                <Card style={[styles.item, on && styles.itemOn]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{t.title}</Text>
                    <Text style={styles.itemSub}>{t.subtitle}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={styles.price}>{formatRubPerHour(t.pricePerHour)}</Text>
                    <View style={[styles.dot, on && styles.dotOn]} />
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          title="Далее"
          disabled={!canContinue}
          onPress={() => {
            if (!picked) {
              Alert.alert('Выберите бригаду', 'Нужно выбрать вариант перед продолжением.');
              return;
            }
            selectTeam(picked);
            navigation.navigate('CargoDetails');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 13, color: Colors.muted, marginBottom: 8 },
  list: { gap: 10, flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemOn: { borderColor: Colors.accent },
  itemTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  itemSub: { marginTop: 4, fontSize: 13, color: Colors.muted },
  priceWrap: { alignItems: 'flex-end', gap: 10 },
  price: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  dotOn: { borderColor: Colors.accent, backgroundColor: Colors.accent },
});

