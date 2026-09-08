import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const isIOS = Platform.OS === 'ios';

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

  const ngn = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  const statusColor = (s: string) =>
    s === 'active' || s === 'approved' || s === 'disbursed' ? '#4ADE80'
      : s === 'pending' || s === 'overdue' ? '#FACC15'
        : s === 'rejected' ? '#F87171' : '#94a3b8';

  const renderModalShell = (children: React.ReactNode) => (
    <View style={styles.modalOverlay}>
      {isIOS ? (
        <BlurView intensity={44} tint="light" style={styles.modalGlass}>
          {children}
        </BlurView>
      ) : (
        <View style={styles.modalM3}>{children}</View>
      )}
    </View>
  );

  const renderPayModal = () => (
    <Modal visible transparent animationType="slide">
      {renderModalShell(
        <>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
            <Ionicons name="swap-horizontal-outline" size={22} color="#D97706" />
          </View>
          <Text style={styles.payNote}>
            Transfer <Text style={styles.bold}>{ngn(Number(pay?.pending.amount))}</Text> to the
            account below using your bank app. Your repayment will be recorded once confirmed.
          </Text>
          <View style={styles.vaBox}>
            <Text style={styles.vaLabel}>{pay?.pending.bankName}</Text>
            <TouchableOpacity onPress={() => pay && copyNumber(pay.pending.accountNumber)}>
              <Text style={styles.vaNumberBig}>{pay?.pending.accountNumber}</Text>
            </TouchableOpacity>
            <Text style={styles.vaName}>{pay?.pending.accountName}</Text>
            <Text style={styles.vaRef}>Ref: {pay?.pending.reference}</Text>
          </View>
          <Text style={styles.payMeta}>
            Status: {pay?.pending.status} ·{' '}
            {pay?.pending.status === 'credited' ? 'Credited'
              : pay?.pending.status === 'expired' ? 'Expired'
                : pay?.pending.expiresAt ? `Transfers expire ${new Date(pay.pending.expiresAt).toLocaleTimeString()}`
                  : 'Awaiting transfer'}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPay(null)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={() => pay && checkRepayment(pay.repaymentId)}>
              <Text style={styles.submitText}>I've transferred · Check</Text>
            </TouchableOpacity>
          </View>
        </>,
      )}
    </Modal>
  );

  const renderApplyModal = () => (
    <Modal visible={showApply} transparent animationType="slide">
      {renderModalShell(
        <>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply for Loan</Text>
            <Ionicons name="add-circle-outline" size={22} color="#0F766E" />
          </View>
          <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={isIOS ? 'rgba(60,60,67,0.45)' : '#9aa3b2'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          <TextInput style={styles.input} placeholder="Duration (months)" placeholderTextColor={isIOS ? 'rgba(60,60,67,0.45)' : '#9aa3b2'} keyboardType="number-pad" value={duration} onChangeText={setDuration} />
          <TextInput style={styles.input} placeholder="Purpose (optional)" placeholderTextColor={isIOS ? 'rgba(60,60,67,0.45)' : '#9aa3b2'} value={purpose} onChangeText={setPurpose} />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowApply(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleApply} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Applying...' : 'Apply'}</Text></TouchableOpacity>
          </View>
        </>,
      )}
    </Modal>
  );

  return (
    <LinearGradient
      colors={isIOS ? ['#0A1F1C', '#123A34', '#173F38'] : ['#0E342C', '#173F38', '#1D4A3F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={[styles.blob, styles.blobGold, { top: -90, right: -70 }]} />
      <View style={[styles.blob, styles.blobTeal, { top: '34%', left: -80 }]} />
      <View style={[styles.blob, styles.blobOrange, { bottom: '8%', right: -60 }]} />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#8AB6D6" colors={['#8AB6D6']} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Loans</Text>
          {eligibility && (
            <View style={[styles.eligCard, isIOS && styles.eligCardGlass]}>
              <View style={styles.eligIcon}>
                <Ionicons
                  name={eligibility.eligible ? 'checkmark-circle' : 'alert-circle'}
                  size={22}
                  color={eligibility.eligible ? '#4ADE80' : '#F87171'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eligTitle, !isIOS && { color: '#173F38' }]}>
                  {eligibility.eligible ? `Eligible: up to ${ngn(eligibility.maxAmount)}` : 'Not eligible'}
                </Text>
                {eligibility.reason && <Text style={styles.eligReason}>{eligibility.reason}</Text>}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowApply(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#173F38" />
            <Text style={styles.applyBtnText}>Apply for Loan</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, isIOS && styles.sectionTitleGlass]}>My Loans ({loans.length})</Text>
        {loans.length === 0 && !loading && (
          <Text style={[styles.emptyText, isIOS && styles.emptyTextGlass]}>No loans yet — apply above to get started.</Text>
        )}
        {loans.map((loan) => (
          <View key={loan.id} style={[styles.loanCard, isIOS && styles.loanCardGlass]}>
            <View style={styles.loanHeader}>
              <View style={styles.loanAmountWrap}>
                <Ionicons name="cash-outline" size={18} color={isIOS ? 'rgba(255,255,255,0.7)' : '#0F766E'} />
                <Text style={[styles.loanAmount, !isIOS && { color: '#173F38' }]}>{ngn(Number(loan.amount))}</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: `${statusColor(loan.status)}22` }]}>
                <Text style={[styles.loanStatus, { color: statusColor(loan.status) }]}>{loan.status}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, isIOS && styles.detailLabelGlass]}>Interest</Text>
                <Text style={[styles.detailValue, !isIOS && { color: '#173F38' }]}>{loan.interestRate}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, isIOS && styles.detailLabelGlass]}>Duration</Text>
                <Text style={[styles.detailValue, !isIOS && { color: '#173F38' }]}>{loan.duration} months</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, isIOS && styles.detailLabelGlass]}>Monthly</Text>
                <Text style={[styles.detailValue, !isIOS && { color: '#173F38' }]}>{ngn(Number(loan.monthlyPayment))}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, isIOS && styles.detailLabelGlass]}>Balance</Text>
                <Text style={[styles.detailValue, !isIOS && { color: '#173F38' }]}>{ngn(Number(loan.balance))}</Text>
              </View>
            </View>
            {loan.nextDueDate && (
              <Text style={[styles.loanDetail, isIOS && styles.loanDetailGlass]}>
                Next due: {new Date(loan.nextDueDate).toLocaleDateString('en-NG')}
              </Text>
            )}
            {loan.repayments?.filter((r) => r.status === 'pending').slice(0, 1).map((r) => (
              <TouchableOpacity key={r.id} style={styles.repayBtn} onPress={() => handleRepay(r.id)} activeOpacity={0.85}>
                <Ionicons name="card-outline" size={16} color="#173F38" />
                <Text style={styles.repayBtnText}>Pay {ngn(Number(r.amount))}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {pay && renderPayModal()}
        {showApply && renderApplyModal()}
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  blobGold: { backgroundColor: 'rgba(228,164,42,0.16)' },
  blobTeal: { backgroundColor: 'rgba(56,180,150,0.14)' },
  blobOrange: { backgroundColor: 'rgba(200,91,35,0.14)' },
  content: { paddingBottom: 32 },
  header: { padding: 20, paddingTop: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 16 },
  eligCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F6F3EB', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  eligCardGlass: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  eligIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.25)' },
  eligTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  eligReason: { fontSize: 13, color: '#627084', marginTop: 4 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#F6F3EB', marginTop: 14, paddingVertical: 16, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  applyBtnText: { color: '#173F38', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#173F38', paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },
  sectionTitleGlass: { color: '#ffffff' },
  emptyText: { fontSize: 13, color: '#627084', paddingHorizontal: 20, paddingBottom: 10 },
  emptyTextGlass: { color: 'rgba(255,255,255,0.65)' },
  loanCard: {
    backgroundColor: '#F6F3EB', marginHorizontal: 20, marginBottom: 10, padding: 18, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  loanCardGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loanAmountWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loanAmount: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  loanStatus: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  detailRow: { flexDirection: 'row', gap: 8 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#627084', fontWeight: '500' },
  detailLabelGlass: { color: 'rgba(255,255,255,0.55)' },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#ffffff', marginTop: 2 },
  loanDetail: { fontSize: 13, color: '#627084', marginTop: 10 },
  loanDetailGlass: { color: 'rgba(255,255,255,0.65)' },
  repayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#4ADE80', marginTop: 14, padding: 14, borderRadius: 14,
  },
  repayBtnText: { color: '#173F38', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modalGlass: {
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  modalM3: {
    backgroundColor: '#F6F3EB', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#173F38', flex: 1 },
  input: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 15, fontSize: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', color: '#173F38',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#E5EDEA', alignItems: 'center' },
  cancelText: { color: '#475569', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#173F38', alignItems: 'center' },
  submitText: { color: '#ffffff', fontWeight: '700' },
  payNote: { fontSize: 14, color: '#475569', marginBottom: 16, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#173F38' },
  vaBox: { backgroundColor: '#E5EDEA', borderRadius: 16, padding: 16, marginBottom: 12 },
  vaLabel: { fontSize: 13, color: '#627084', fontWeight: '500' },
  vaNumberBig: { fontSize: 24, fontWeight: '800', color: '#173F38', letterSpacing: 1.5, marginTop: 4 },
  vaName: { fontSize: 13, color: '#334155', marginTop: 2 },
  vaRef: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  payMeta: { fontSize: 13, color: '#627084', marginBottom: 16, textAlign: 'center' },
});