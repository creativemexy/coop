import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { InvestmentProduct } from '../../types';

export default function InvestmentsScreen() {
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvest, setShowInvest] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.investments.products);
        setProducts(Array.isArray(data) ? data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const openInvest = (p: InvestmentProduct) => { setSelectedProduct(p); setAmount(''); setShowInvest(true); };

  const handleInvest = async () => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt < (selectedProduct?.minimumInvestment ?? 0)) {
      Alert.alert('Error', `Minimum: ₦${(selectedProduct?.minimumInvestment ?? 0).toLocaleString()}`);
      return;
    }
    if (selectedProduct?.maximumInvestment != null && amt > selectedProduct.maximumInvestment) {
      Alert.alert('Error', `Maximum: ₦${selectedProduct.maximumInvestment.toLocaleString()}`);
      return;
    }
    setSubmitting(true);
    try {
      await client.post(ENDPOINTS.investments.invest, { productId: selectedProduct!.id, amount: Number(amount) });
      Alert.alert('Success', 'Investment submitted');
      setShowInvest(false);
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      {products.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.roi}>{p.expectedReturnRate ?? 0}% ROI</Text>
          <Text style={styles.desc} numberOfLines={2}>{p.description}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>Min: ₦{Number(p.minimumInvestment ?? 0).toLocaleString()}</Text>
            <Text style={styles.metaItem}>Duration: {p.tenorDays ?? '-'} days</Text>
          </View>
          <TouchableOpacity style={styles.investBtn} onPress={() => openInvest(p)}>
            <Text style={styles.investBtnText}>Invest Now</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={showInvest} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Invest in {selectedProduct?.name}</Text>
            <Text style={styles.roiLabel}>
              ROI: {selectedProduct?.expectedReturnRate ?? 0}% | Min: ₦{Number(selectedProduct?.minimumInvestment ?? 0).toLocaleString()}
              {selectedProduct?.maximumInvestment != null ? ` | Max: ₦${selectedProduct.maximumInvestment.toLocaleString()}` : ''}
            </Text>
            <TextInput style={styles.input} placeholder="Amount" placeholderTextColor="#999" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInvest(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleInvest} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Processing...' : 'Invest'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  roi: { fontSize: 24, fontWeight: 'bold', color: '#22c55e', marginVertical: 4 },
  desc: { fontSize: 13, color: '#666', marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { fontSize: 12, color: '#999' },
  investBtn: { backgroundColor: '#22c55e', padding: 14, borderRadius: 8, alignItems: 'center' },
  investBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e' },
  roiLabel: { fontSize: 14, color: '#666', marginBottom: 16 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
});
