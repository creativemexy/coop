import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import {
  SavingsAccount,
  SavingsTransaction,
  VirtualAccount,
  DepositInstruction,
} from '../../types';

type ActionType = 'deposit' | 'withdraw' | 'target' | null;
type DepositType = 'general' | 'goal';

export default function SavingsScreen() {
  const [account, setAccount] = useState<SavingsAccount | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [txns, setTxns] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ActionType>(null);
  const [amount, setAmount] = useState('');
  const [target, setTarget] = useState('');
  const [depositType, setDepositType] = useState<DepositType>('general');
  const [submitting, setSubmitting] = useState(false);
  const [instruction, setInstruction] = useState<DepositInstruction | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const [a, t, va] = await Promise.all([
        client.get(ENDPOINTS.savings.account),
        client.get(ENDPOINTS.savings.transactions),
        client.get(ENDPOINTS.virtualAccounts.me),
      ]);
      setAccount(a.data);
      setTxns(t.data);
      setVirtualAccount(va.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  useEffect(() => {
    if (!instruction || instruction.status !== 'pending' || !instruction.expiresAt) return;
    const deadline = new Date(instruction.expiresAt).getTime();
    if (isNaN(deadline)) return;
    const t = setInterval(async () => {
      try {
        const { data } = await client.post(ENDPOINTS.virtualAccounts.depositsVerify(instruction.id));
        const d: DepositInstruction = data;
        if (d.status === 'credited') {
          setInstruction(null);
          setNotice(`₦${Number(d.amount).toLocaleString()} credited to your savings`);
          setTimeout(() => setNotice(null), 6000);
          fetch();
        } else if (d.status === 'expired') {
          setInstruction(null);
          fetch();
        } else {
          setInstruction(d);
        }
      } catch { /* ignore transient errors */ }
    }, 5000);
    return () => clearInterval(t);
  }, [instruction?.id, instruction?.status, instruction?.expiresAt]);

  const copyNumber = async (number: string) => {
    try {
      await Clipboard.setStringAsync(number);
      setCopied(number);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  const handleInitiateDeposit = async () => {
    if (!modal) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      const { data } = await client.post(ENDPOINTS.virtualAccounts.depositsInitiate, {
        amount: amt,
        type: depositType,
      });
      const d: DepositInstruction = data;
      setAmount('');
      setModal(null);
      if (d.status === 'credited') {
        setNotice(`₦${Number(d.amount).toLocaleString()} deposited to your savings`);
        setTimeout(() => setNotice(null), 6000);
        fetch();
      } else {
        setInstruction(d);
      }
    } catch (e: any) {
      Alert.alert('Error', getErrorMessage(e, 'Deposit failed'));
    } finally { setSubmitting(false); }
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    try {
      await client.post(ENDPOINTS.savings.withdraw, { amount: Number(amount) });
      setModal(null);
      setAmount('');
      fetch();
    } catch (e: any) {
      Alert.alert('Error', getErrorMessage(e, 'Withdrawal failed'));
    } finally { setSubmitting(false); }
  };

  const handleSetTarget = async () => {
    setSubmitting(true);
    try {
      await client.post(ENDPOINTS.savings.target, { targetAmount: Number(target) });
      Alert.alert('Success', 'Target updated');
      setModal(null);
      setTarget('');
      fetch();
    } catch (e: any) {
      Alert.alert('Error', getErrorMessage(e, 'Failed to update target'));
    } finally { setSubmitting(false); }
  };

  const handleAction = async () => {
    if (modal === 'deposit') return handleInitiateDeposit();
    if (modal === 'withdraw') return handleWithdraw();
    if (modal === 'target') return handleSetTarget();
  };

  const expiresText = (d: DepositInstruction) =>
    d.status === 'credited' ? 'Credited'
      : d.status === 'expired' ? 'Expired'
        : d.expiresAt
          ? `Transfers expire ${new Date(d.expiresAt).toLocaleTimeString()}`
          : '';

  const handleVerifyDeposit = async (id: string) => {
    try {
      const { data } = await client.post(ENDPOINTS.virtualAccounts.depositsVerify(id));
      const d = data as DepositInstruction;
      if (d.status === 'credited') {
        setInstruction(null);
        setNotice(`₦${Number(d.amount).toLocaleString()} credited to your savings`);
        setTimeout(() => setNotice(null), 6000);
        fetch();
      } else {
        setInstruction(d);
      }
    } catch { /* ignore */ }
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

      {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      {(() => {
        const targetSet = (account?.targetAmount ?? 0) > 0;
        const targetMet = targetSet && (account?.goalBalance ?? 0) >= (account?.targetAmount ?? 0);
        return targetSet && !targetMet ? (
          <View style={styles.targetNotice}>
            <Text style={styles.targetNoticeText}>
              Withdrawals are disabled until your savings goal of ₦{Number(account?.targetAmount ?? 0).toLocaleString()} is met.
            </Text>
          </View>
        ) : null;
      })()}

      {virtualAccount && (
        <View style={styles.vaCard}>
          <Text style={styles.vaTitle}>Your bank transfer account</Text>
          <Text style={styles.vaSub}>Use it to fund savings anytime via a normal bank transfer.</Text>
          <View style={styles.vaRow}>
            <View>
              <Text style={styles.vaLabel}>{virtualAccount.bankName}</Text>
              <Text style={styles.vaNumber}>{virtualAccount.accountNumber}</Text>
              <Text style={styles.vaName}>{virtualAccount.accountName}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={() => copyNumber(virtualAccount.accountNumber)}>
              <Text style={styles.copyBtnText}>{copied === virtualAccount.accountNumber ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {(['deposit', 'withdraw', 'target'] as Exclude<ActionType, null>[]).map((a) => {
          const targetSet = (account?.targetAmount ?? 0) > 0;
          const targetMet = targetSet && (account?.goalBalance ?? 0) >= (account?.targetAmount ?? 0);
          const disabled = a === 'withdraw' && targetSet && !targetMet;
          return (
            <TouchableOpacity
              key={a}
              style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
              disabled={disabled}
              onPress={() => { setModal(a); setAmount(''); setDepositType('general'); }}
            >
              <Text style={[styles.actionBtnText, disabled && styles.actionBtnTextDisabled]}>
                {a === 'target' ? 'Set Target' : a.charAt(0).toUpperCase() + a.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Transactions</Text>
      {txns.slice(0, 20).map((t) => (
        <View key={t.id} style={styles.txnRow}>
          <View style={styles.txnInfo}>
            <Text style={styles.txnType}>
              {t.type === 'interest' ? 'Interest' : t.type === 'withdrawal' ? 'Withdrawal' : 'Deposit'}
            </Text>
            <Text style={styles.txnDesc} numberOfLines={1}>{t.description || 'Savings transaction'}</Text>
          </View>
          <View style={styles.txnRight}>
            <Text style={styles.txnDate}>{new Date(t.createdAt).toLocaleDateString('en-NG')}</Text>
            <Text style={styles.txnStatus}>{t.status || (t.type === 'deposit' || t.type === 'interest' ? 'credited' : 'completed')}</Text>
          </View>
          <Text style={[styles.txnAmount, t.type === 'deposit' || t.type === 'interest' ? styles.green : styles.red]}>
            {t.type === 'deposit' || t.type === 'interest' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
          </Text>
        </View>
      ))}

      <Modal visible={!!instruction} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
            <Text style={styles.instructionNote}>
              Transfer <Text style={styles.bold}>₦{Number(instruction?.amount ?? 0).toLocaleString()}</Text> to the
              account below using your bank app. Your savings will be credited automatically once confirmed.
            </Text>
            <View style={styles.vaBox}>
              <Text style={styles.vaLabel}>{instruction?.bankName}</Text>
              <TouchableOpacity onPress={() => instruction && copyNumber(instruction.accountNumber)}>
                <Text style={styles.vaNumberBig}>{instruction?.accountNumber}</Text>
              </TouchableOpacity>
              <Text style={styles.vaName}>{instruction?.accountName}</Text>
              <Text style={styles.vaRef}>Ref: {instruction?.reference}</Text>
            </View>
            <Text style={styles.instructionMeta}>
              Status: {instruction?.status} · {instruction ? expiresText(instruction) : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setInstruction(null)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={() => instruction && handleVerifyDeposit(instruction.id)}>
                <Text style={styles.submitText}>I've transferred · Check</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {modal === 'deposit' ? 'Deposit via Bank Transfer' : modal === 'withdraw' ? 'Withdraw' : 'Set Savings Target'}
            </Text>

            {modal === 'deposit' && (
              <View style={styles.typeToggle}>
                {(['general', 'goal'] as DepositType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, depositType === t && styles.typeBtnActive]}
                    onPress={() => setDepositType(t)}
                  >
                    <Text style={[styles.typeBtnText, depositType === t && styles.typeBtnTextActive]}>
                      {t === 'general' ? 'General' : 'Goal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder={modal === 'target' ? 'Target amount' : 'Amount'}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={modal === 'target' ? target : amount}
              onChangeText={modal === 'target' ? setTarget : setAmount}
            />

            {modal === 'deposit' && (
              <Text style={styles.depositHint}>
                You'll get a dedicated account number to transfer into. No card required.
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAction} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Processing...' : modal === 'deposit' ? 'Get Account' : 'Confirm'}</Text>
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
  notice: { backgroundColor: '#dcfce7', padding: 12, margin: 16, borderRadius: 8 },
  noticeText: { color: '#166534', fontWeight: '600' },
  targetNotice: { backgroundColor: '#fef3c7', padding: 12, margin: 16, borderRadius: 8 },
  targetNoticeText: { color: '#92400e', fontWeight: '500', fontSize: 13 },
  vaCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 1 },
  vaTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  vaSub: { fontSize: 13, color: '#666', marginTop: 2 },
  vaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  vaLabel: { fontSize: 13, color: '#666' },
  vaNumber: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', letterSpacing: 1 },
  vaName: { fontSize: 13, color: '#333', marginTop: 2 },
  copyBtn: { backgroundColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  copyBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  actions: { flexDirection: 'row', padding: 16, paddingTop: 0, gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 14, alignItems: 'center', elevation: 1 },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#1a1a2e', fontWeight: '600', fontSize: 14 },
  actionBtnTextDisabled: { color: '#9ca3af' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', paddingHorizontal: 16, marginBottom: 8 },
  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, marginHorizontal: 16, marginBottom: 1 },
  txnInfo: { flex: 1, minWidth: 0 },
  txnType: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  txnDesc: { fontSize: 13, color: '#1a1a2e', marginTop: 1 },
  txnDate: { fontSize: 11, color: '#999' },
  txnRight: { alignItems: 'flex-end', marginHorizontal: 12 },
  txnStatus: { fontSize: 11, color: '#22c55e', marginTop: 1, textTransform: 'capitalize' },
  txnAmount: { fontSize: 15, fontWeight: '700', minWidth: 90, textAlign: 'right' },
  green: { color: '#22c55e' },
  red: { color: '#ef4444' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  typeToggle: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 8, marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  typeBtnActive: { backgroundColor: '#1a1a2e' },
  typeBtnText: { color: '#666', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 20 },
  depositHint: { fontSize: 13, color: '#666', marginBottom: 16 },
  instructionNote: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#1a1a2e' },
  vaBox: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 12 },
  vaNumberBig: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', letterSpacing: 1, marginTop: 2 },
  vaRef: { fontSize: 12, color: '#999', marginTop: 8 },
  instructionMeta: { fontSize: 13, color: '#888', marginBottom: 16, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
});