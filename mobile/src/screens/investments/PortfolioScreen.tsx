import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';

interface PortfolioItem {
  id: string; productName: string; amount: number; currentValue: number; roi: number; status: string; startDate: string; maturityDate: string;
}

export default function PortfolioScreen() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.investments.portfolio);
        setItems(Array.isArray(data) ? data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const totalInvested = items.reduce((s, i) => s + Number(i.amount), 0);
  const totalCurrent = items.reduce((s, i) => s + Number(i.currentValue), 0);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <View style={styles.overview}>
        <View style={styles.ovCard}>
          <Text style={styles.ovLabel}>Total Invested</Text>
          <Text style={styles.ovValue}>₦{totalInvested.toLocaleString()}</Text>
        </View>
        <View style={styles.ovCard}>
          <Text style={styles.ovLabel}>Current Value</Text>
          <Text style={[styles.ovValue, { color: '#22c55e' }]}>₦{totalCurrent.toLocaleString()}</Text>
        </View>
      </View>

      {items.map((i) => (
        <View key={i.id} style={styles.card}>
          <Text style={styles.name}>{i.productName}</Text>
          <Text style={[styles.roi, { color: i.roi >= 0 ? '#22c55e' : '#ef4444' }]}>{i.roi >= 0 ? '+' : ''}{i.roi}%</Text>
          <View style={styles.row}><Text style={styles.label}>Invested</Text><Text style={styles.value}>₦{Number(i.amount).toLocaleString()}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Current</Text><Text style={styles.value}>₦{Number(i.currentValue).toLocaleString()}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={[styles.value, { textTransform: 'capitalize' }]}>{i.status}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Started</Text><Text style={styles.value}>{new Date(i.startDate).toLocaleDateString('en-NG')}</Text></View>
          {i.maturityDate && <View style={styles.row}><Text style={styles.label}>Matures</Text><Text style={styles.value}>{new Date(i.maturityDate).toLocaleDateString('en-NG')}</Text></View>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  overview: { flexDirection: 'row', padding: 16, gap: 8 },
  ovCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16 },
  ovLabel: { color: '#9ca3af', fontSize: 12 },
  ovValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  roi: { fontSize: 20, fontWeight: 'bold', marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 13, color: '#1a1a2e', fontWeight: '500' },
});
