import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { SavingsAccount, SavingsTransaction } from '../../types';

type ActionType = 'deposit' | 'withdraw' | 'target' | null;
const ACTIONS: Exclude<ActionType, null>[] = ['deposit', 'withdraw', 'target'];

export default function SavingsScreen() {
  const [account, setAccount] = useState<SavingsAccount | null>(null);
  const [txns, setTxns] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ActionType>(null);
  const [amount, setAmount] = useState('');
  const [target, setTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([
        client.get(ENDPOINTS.savings.account),
        client.get(ENDPOINTS.savings.transactions),
      ]);
      setAccount(a.data);
      setTxns(t.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleAction = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      if (modal === 'target') {
        await client.post(ENDPOINTS.savings.target, { targetAmount: Number(target) });
      } else {
        await client.post(ENDPOINTS.savings[modal], { amount: Number(amount) });
      }
      Alert.alert('Success', modal === 'target' ? 'Target updated' : `${modal} completed`);
      setModal(null);
      setAmount('');
      setTarget('');
      fetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Something went wrong');
    } finally { setSubmitting(false); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}>
      <View style={styles.header}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>General</Text>
            <Text style={styles.balanceValue}>₦{(account?.balance ?? 0).toLocaleString()}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Goal</Text>
            <Text style={styles.balanceValue}>₦{(account?.goalBalance ?? 0).toLocaleString()}</Text>
          </View>
        </View>
        {account?.targetAmount ? (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, ((account.goalBalance ?? 0) / account.targetAmount) * 100)}%` }]} />
            <Text style={styles.progressText}>Goal: ₦{account.targetAmount.toLocaleString()}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <TouchableOpacity key={a} style={styles.actionBtn} onPress={() => { setModal(a); setAmount(''); }}>
            <Text style={styles.actionBtnText}>{a === 'target' ? 'Set Target' : a.charAt(0).toUpperCase() + a.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Transactions</Text>
      {txns.slice(0, 20).map((t) => (
        <View key={t.id} style={styles.txnRow}>
          <View>
            <Text style={styles.txnDesc}>{t.description || t.type}</Text>
            <Text style={styles.txnDate}>{new Date(t.createdAt).toLocaleDateString('en-NG')}</Text>
          </View>
          <Text style={[styles.txnAmount, t.type === 'deposit' ? styles.green : styles.red]}>
            {t.type === 'deposit' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
          </Text>
        </View>
      ))}

      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {modal === 'deposit' ? 'Deposit' : modal === 'withdraw' ? 'Withdraw' : 'Set Savings Target'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={modal === 'target' ? 'Target amount' : 'Amount'}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={modal === 'target' ? target : amount}
              onChangeText={modal === 'target' ? setTarget : setAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAction} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Processing...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1a1a2e', padding: 20 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
  balanceItem: { alignItems: 'center' },
  balanceLabel: { color: '#9ca3af', fontSize: 13 },
  balanceValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  progressBar: { height: 20, backgroundColor: '#374151', borderRadius: 10, marginTop: 16, overflow: 'hidden', justifyContent: 'center' },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 10, position: 'absolute' },
  progressText: { color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  actions: { flexDirection: 'row', padding: 16, gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 14, alignItems: 'center', elevation: 1 },
  actionBtnText: { color: '#1a1a2e', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', paddingHorizontal: 16, marginBottom: 8 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 1, alignItems: 'center' },
  txnDesc: { fontSize: 14, color: '#1a1a2e' },
  txnDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '600' },
  green: { color: '#22c55e' },
  red: { color: '#ef4444' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
});
