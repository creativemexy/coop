import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';

interface Redemption {
  id: string; productName: string; amount: number; status: string; createdAt: string;
}

export default function RedemptionsScreen() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRedeem, setShowRedeem] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([
          client.get(ENDPOINTS.investments.redemptions),
          client.get(ENDPOINTS.investments.portfolio),
        ]);
        setRedemptions(Array.isArray(r.data) ? r.data : []);
        setPortfolio(Array.isArray(p.data) ? p.data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const handleRedeem = async () => {
    if (!selectedId || !redeemAmount) { Alert.alert('Error', 'Select an investment and enter amount'); return; }
    setLoading(true);
    try {
      await client.post(ENDPOINTS.investments.redemptions, { investmentId: selectedId, amount: Number(redeemAmount) });
      Alert.alert('Success', 'Redemption initiated');
      setShowRedeem(false); setSelectedId(''); setRedeemAmount('');
      const { data } = await client.get(ENDPOINTS.investments.redemptions);
      setRedemptions(Array.isArray(data) ? data : []);
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <TouchableOpacity style={styles.requestBtn} onPress={() => setShowRedeem(true)}>
        <Text style={styles.requestBtnText}>+ Request Redemption</Text>
      </TouchableOpacity>

      {redemptions.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.productName}>{r.productName}</Text>
          <Text style={styles.amount}>₦{Number(r.amount).toLocaleString()}</Text>
          <Text style={[styles.status, { color: r.status === 'approved' ? '#22c55e' : r.status === 'completed' ? '#2563eb' : r.status === 'rejected' ? '#ef4444' : '#eab308' }]}>
            {r.status.toUpperCase()}
          </Text>
          <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString('en-NG')}</Text>
        </View>
      ))}

      <Modal visible={showRedeem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Request Redemption</Text>
            {portfolio.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => { setSelectedId(p.id); }} style={[styles.portfolioItem, selectedId === p.id && styles.selectedItem]}>
                <Text style={styles.portfolioName}>{p.productName}</Text>
                <Text style={styles.portfolioValue}>₦{Number(p.currentValue).toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
            {selectedId ? <TextInput style={styles.input} placeholder="Amount to redeem" placeholderTextColor="#999" value={redeemAmount} onChangeText={setRedeemAmount} keyboardType="numeric" /> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRedeem(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleRedeem} disabled={!selectedId}><Text style={styles.submitText}>Submit</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  requestBtn: { backgroundColor: '#1a1a2e', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  requestBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  amount: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginVertical: 4 },
  status: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 12, color: '#999' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  portfolioItem: { backgroundColor: '#f5f5f5', padding: 14, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  selectedItem: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#2563eb' },
  portfolioName: { fontSize: 14, color: '#1a1a2e' },
  portfolioValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
});
