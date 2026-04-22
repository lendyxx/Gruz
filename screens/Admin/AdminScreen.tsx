import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAdmin } from '../../context/AdminContext';
import { Colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { User } from '../../types';

export function AdminScreen() {
  const { isAdmin, setUserAsAdmin, removeUserAdmin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Админ-панель</Text>
        <Text style={styles.subtitle}>Управление пользователями и правами</Text>

        {loading ? (
          <Text style={styles.loading}>Загрузка...</Text>
        ) : (
          <View style={styles.usersList}>
            <Text style={styles.sectionTitle}>Пользователи ({users.length})</Text>
            {users.map(user => (
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
            ))}
          </View>
        )}

        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Возможности администратора:</Text>
          <Text style={styles.infoText}>• Удаление заказов пользователей</Text>
          <Text style={styles.infoText}>• Изменение данных заказов</Text>
          <Text style={styles.infoText}>• Изменение имени пользователя</Text>
          <Text style={styles.infoText}>• Назначение других администраторов</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 28 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 10,
  },
  loading: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  usersList: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
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
  infoBlock: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
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
});
