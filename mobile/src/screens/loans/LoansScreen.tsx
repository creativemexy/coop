import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { Loan, LoanEligibility, DepositInstruction } from '../../types';

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pay, setPay] = useState<{ repaymentId: string; pending: DepositInstruction } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  const checkRepayment = useCallback(async (repaymentId: string) => {
    try {
      const { data } = await client.post(ENDPOINTS.virtualAccounts.loanRepayVerify(repaymentId));
      const d: DepositInstruction = data;
      setPay((prev) => prev && d ? { repaymentId, pending: d } : prev);
      if (d && d.status === 'credited') {
        setPay(null);
        Alert.alert('Success', `Repayment received (${d.reference})`);
        fetch();
      }
    } catch { /* keep modal open; re-poll */ }
  }, []);

  useEffect(() => {
    if (!pay || pay.pending.status !== 'pending') return;
    const t = setInterval(() => checkRepayment(pay.repaymentId), 5000);
    return () => clearInterval(t);
  }, [pay?.pending.status, pay?.pending.id, checkRepayment]);

  const handleApply = async () => {
    if (!amount || !duration) { Alert.alert('Error', 'Amount and duration required'); return; }
    setSubmitting(true);
    try {
      await client.post(ENDPOINTS.loans.apply, { amount: Number(amount), duration: Number(duration), purpose });
      Alert.alert('Success', 'Loan application submitted');
      setShowApply(false);
      setAmount(''); setDuration(''); setPurpose('');
      fetch();
    } catch (e: any) { Alert.alert('Error', getErrorMessage(e, 'Failed to apply')); }
    finally { setSubmitting(false); }
  };

  const handleRepay = async (repaymentId: string) => {
    try {
      const { data } = await client.post(ENDPOINTS.virtualAccounts.loanRepayInitiate(repaymentId));
      const pending: DepositInstruction = data;
      setPay({ repaymentId, pending });
    } catch (e: any) { Alert.alert('Error', getErrorMessage(e, 'Could not start payment')); }
  };

  const copyNumber = async (number: string) => {
    try {
      await Clipboard.setStringAsync(number);
      setCopied(number);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
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
            <TouchableOpacity key={r.id} style={styles.repayBtn} onPress={() => handleRepay(r.id)}>
              <Text style={styles.repayBtnText}>Pay ₦{Number(r.amount).toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {pay && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
              <Text style={styles.payNote}>
                Transfer <Text style={styles.bold}>₦{Number(pay.pending.amount).toLocaleString()}</Text> to the
                account below using your bank app. Your repayment will be recorded once confirmed.
              </Text>
              <View style={styles.vaBox}>
                <Text style={styles.vaLabel}>{pay.pending.bankName}</Text>
                <TouchableOpacity onPress={() => copyNumber(pay.pending.accountNumber)}>
                  <Text style={styles.vaNumberBig}>{pay.pending.accountNumber}</Text>
                </TouchableOpacity>
                <Text style={styles.vaName}>{pay.pending.accountName}</Text>
                <Text style={styles.vaRef}>Ref: {pay.pending.reference}</Text>
              </View>
              <Text style={styles.payMeta}>
                Status: {pay.pending.status} ·{' '}
                {pay.pending.status === 'credited' ? 'Credited'
                  : pay.pending.status === 'expired' ? 'Expired'
                    : pay.pending.expiresAt ? `Transfers expire ${new Date(pay.pending.expiresAt).toLocaleTimeString()}`
                      : 'Awaiting transfer'}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPay(null)}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={() => checkRepayment(pay.repaymentId)}>
                  <Text style={styles.submitText}>I've transferred · Check</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
  payNote: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#1a1a2e' },
  vaBox: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 12 },
  vaLabel: { fontSize: 13, color: '#666' },
  vaNumberBig: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', letterSpacing: 1, marginTop: 2 },
  vaName: { fontSize: 13, color: '#333', marginTop: 2 },
  vaRef: { fontSize: 12, color: '#999', marginTop: 8 },
  payMeta: { fontSize: 13, color: '#888', marginBottom: 16, textAlign: 'center' },
});
