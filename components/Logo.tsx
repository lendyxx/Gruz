import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export function Logo() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Грузовичок</Text>
      <Text style={styles.subtitle}>квартирные и офисные перевозки</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  title: { fontSize: 34, fontWeight: '800', color: Colors.accent, letterSpacing: 0.2 },
  subtitle: { fontSize: 13, color: Colors.muted },
});

