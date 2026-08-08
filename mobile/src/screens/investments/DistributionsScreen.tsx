import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';

interface Distribution {
  id: string; productName: string; amount: number; type: string; status: string; date: string;
}

export default function DistributionsScreen() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const totalDistributed = distributions.reduce((s, d) => d.status === 'paid' ? s + Number(d.amount) : s, 0);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.investments.distributions);
        setDistributions(Array.isArray(data) ? data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Distributions Received</Text>
        <Text style={styles.totalValue}>₦{totalDistributed.toLocaleString()}</Text>
      </View>

      {distributions.map((d) => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.productName}>{d.productName}</Text>
          <Text style={styles.amount}>₦{Number(d.amount).toLocaleString()}</Text>
          <View style={styles.row}>
            <Text style={styles.type}>{d.type}</Text>
            <Text style={[styles.status, { color: d.status === 'paid' ? '#22c55e' : '#eab308' }]}>{d.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.date}>{new Date(d.date).toLocaleDateString('en-NG')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  totalCard: { backgroundColor: '#1a1a2e', margin: 16, padding: 24, borderRadius: 12, alignItems: 'center' },
  totalLabel: { color: '#9ca3af', fontSize: 14 },
  totalValue: { color: '#22c55e', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  amount: { fontSize: 20, fontWeight: 'bold', color: '#22c55e', marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  type: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  status: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12, color: '#999' },
});
