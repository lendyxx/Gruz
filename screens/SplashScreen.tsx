import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Logo } from '../components/Logo';
import { Colors } from '../theme/colors';

export function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      <Logo />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
});

