import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { PaymentMethod } from '../../types';

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.paymentMethods);
        setMethods(Array.isArray(data) ? data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const remove = (id: string) => {
    Alert.alert('Remove', 'Remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await client.delete(`${ENDPOINTS.paymentMethods}/${id}`);
          setMethods(methods.filter((m) => m.id !== id));
        } catch { Alert.alert('Error', 'Failed to remove'); }
      }},
    ]);
  };

  const setDefault = async (id: string) => {
    try {
      await client.patch(`${ENDPOINTS.paymentMethods}/${id}`, { isDefault: true });
      setMethods(methods.map((m) => ({ ...m, isDefault: m.id === id })));
    } catch { Alert.alert('Error', 'Failed to set default'); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      {methods.map((m) => (
        <View key={m.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.type}>{m.type === 'card' ? '💳' : '🏦'} {m.type.toUpperCase()}</Text>
            {m.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
          </View>
          {m.type === 'card' ? (
            <Text style={styles.detail}>{m.cardBrand} ····{m.last4}</Text>
          ) : (
            <View><Text style={styles.detail}>{m.bankName}</Text><Text style={styles.detail}>{m.accountName} · {m.accountNumber}</Text></View>
          )}
          <Text style={styles.provider}>{m.provider}</Text>
          <View style={styles.actions}>
            {!m.isDefault && <TouchableOpacity onPress={() => setDefault(m.id)}><Text style={styles.actionDefault}>Set Default</Text></TouchableOpacity>}
            <TouchableOpacity onPress={() => remove(m.id)}><Text style={styles.actionRemove}>Remove</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      {methods.length === 0 && !loading && (
        <Text style={styles.empty}>No saved payment methods</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  type: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  defaultBadge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 11, color: '#fff', fontWeight: '600' },
  detail: { fontSize: 14, color: '#1a1a2e', marginBottom: 2 },
  provider: { fontSize: 12, color: '#999', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionDefault: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  actionRemove: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
});
