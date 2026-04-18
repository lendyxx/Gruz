import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Logo } from '../components/Logo';
import { Colors } from '../theme/colors';

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <Logo />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
});

