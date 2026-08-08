import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { Loan, LoanEligibility } from '../../types';

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [l, e] = await Promise.all([
        client.get(ENDPOINTS.loans.list),
        client.get(ENDPOINTS.loans.eligibility),
      ]);
      setLoans(l.data);
      setEligibility(e.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleApply = async () => {
    if (!amount || !duration) { Alert.alert('Error', 'Amount and duration required'); return; }
    setSubmitting(true);
    try {
      await client.post(ENDPOINTS.loans.apply, { amount: Number(amount), duration: Number(duration), purpose });
      Alert.alert('Success', 'Loan application submitted');
      setShowApply(false);
      setAmount(''); setDuration(''); setPurpose('');
      fetch();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Failed to apply'); }
    finally { setSubmitting(false); }
  };

  const handleRepay = async (loanId: string, repaymentId: string) => {
    try {
      await client.post(ENDPOINTS.loans.repay(loanId, repaymentId));
      Alert.alert('Success', 'Repayment recorded');
      fetch();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Repayment failed'); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}>
      {eligibility && (
        <View style={[styles.card, eligibility.eligible ? styles.cardBorderGreen : styles.cardBorderRed]}>
          <Text style={styles.eligTitle}>
            {eligibility.eligible ? `Eligible: up to ₦${eligibility.maxAmount.toLocaleString()}` : 'Not eligible'}
          </Text>
          {eligibility.reason && <Text style={styles.eligReason}>{eligibility.reason}</Text>}
        </View>
      )}

      <TouchableOpacity style={styles.applyBtn} onPress={() => setShowApply(true)}>
        <Text style={styles.applyBtnText}>Apply for Loan</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Loans ({loans.length})</Text>
      {loans.map((loan) => (
        <View key={loan.id} style={styles.loanCard}>
          <View style={styles.loanHeader}>
            <Text style={styles.loanAmount}>₦{Number(loan.amount).toLocaleString()}</Text>
            <Text style={[styles.loanStatus, { color: loan.status === 'active' ? '#22c55e' : '#eab308' }]}>{loan.status}</Text>
          </View>
          <Text style={styles.loanDetail}>Interest: {loan.interestRate}% · {loan.duration} months</Text>
          <Text style={styles.loanDetail}>Monthly: ₦{Number(loan.monthlyPayment).toLocaleString()} · Balance: ₦{Number(loan.balance).toLocaleString()}</Text>
          {loan.nextDueDate && <Text style={styles.loanDetail}>Next due: {new Date(loan.nextDueDate).toLocaleDateString('en-NG')}</Text>}
          {loan.repayments?.filter((r) => r.status === 'pending').slice(0, 1).map((r) => (
            <TouchableOpacity key={r.id} style={styles.repayBtn} onPress={() => handleRepay(loan.id, r.id)}>
              <Text style={styles.repayBtnText}>Pay ₦{Number(r.amount).toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <Modal visible={showApply} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Apply for Loan</Text>
            <TextInput style={styles.input} placeholder="Amount" placeholderTextColor="#999" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Duration (months)" placeholderTextColor="#999" keyboardType="number-pad" value={duration} onChangeText={setDuration} />
            <TextInput style={styles.input} placeholder="Purpose (optional)" placeholderTextColor="#999" value={purpose} onChangeText={setPurpose} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowApply(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleApply} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Applying...' : 'Apply'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, backgroundColor: '#fff', borderLeftWidth: 4 },
  cardBorderGreen: { borderLeftColor: '#22c55e' },
  cardBorderRed: { borderLeftColor: '#ef4444' },
  eligTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  eligReason: { fontSize: 13, color: '#666', marginTop: 4 },
  applyBtn: { backgroundColor: '#1a1a2e', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', paddingHorizontal: 16, marginBottom: 8 },
  loanCard: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loanAmount: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  loanStatus: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  loanDetail: { fontSize: 13, color: '#666', marginBottom: 2 },
  repayBtn: { backgroundColor: '#22c55e', marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center' },
  repayBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
});
