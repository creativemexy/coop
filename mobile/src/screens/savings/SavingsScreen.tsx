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
  const isIOS = Platform.OS === 'ios';

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

  const actionMeta: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    deposit: { icon: 'arrow-down-circle-outline', color: '#0F766E' },
    withdraw: { icon: 'arrow-up-circle-outline', color: '#D97706' },
    target: { icon: 'flag-outline', color: '#7C3AED' },
  };

  const ngn = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  const goalPercent = (() => {
    const target = Number(account?.targetAmount);
    const goal = Number(account?.goalBalance);
    if (!target || isNaN(target) || isNaN(goal) || target <= 0) return 0;
    return Math.min(100, (goal / target) * 100);
  })();

  const modalShellStyle = [isIOS ? styles.modalGlass : styles.modalM3];

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

  const renderActionModal = () => (
    <Modal visible={!!modal} transparent animationType="slide">
      {renderModalShell(
        <>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modal === 'deposit' ? 'Deposit via Bank Transfer' : modal === 'withdraw' ? 'Withdraw' : 'Set Savings Target'}
            </Text>
            <Ionicons
              name={actionMeta[modal ?? 'deposit']?.icon ?? 'wallet-outline'}
              size={22}
              color={actionMeta[modal ?? 'deposit']?.color ?? '#0F766E'}
            />
          </View>

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
            placeholderTextColor={isIOS ? 'rgba(60,60,67,0.45)' : '#9aa3b2'}
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
        </>,
      )}
    </Modal>
  );

  const renderInstructionModal = () => (
    <Modal visible={!!instruction} transparent animationType="slide">
      {renderModalShell(
        <>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pay via Bank Transfer</Text>
            <Ionicons name="swap-horizontal-outline" size={22} color="#0F766E" />
          </View>
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
        </>,
      )}
    </Modal>
  );

  const sectionCardStyle = [isIOS ? styles.sectionGlass : styles.sectionM3];

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
          <Text style={styles.headerTitle}>Savings</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>General Balance</Text>
              <Text style={styles.balanceValue}>{ngn(account?.balance ?? 0)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Goal Balance</Text>
              <Text style={styles.balanceValue}>{ngn(account?.goalBalance ?? 0)}</Text>
            </View>
          </View>
          {account?.targetAmount ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Goal: {ngn(account.targetAmount)}</Text>
                <Text style={styles.progressPct}>
                  {Math.round(goalPercent)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, isIOS && styles.progressTrackGlass]}>
                <View style={[styles.progressFill, { width: `${goalPercent}%` }]} />
              </View>
            </View>
          ) : null}
        </View>

        {notice ? (
          <View style={styles.notice}>
            <Ionicons name="checkmark-circle" size={18} color="#166534" />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {(() => {
          const targetSet = (account?.targetAmount ?? 0) > 0;
          const targetMet = targetSet && (account?.goalBalance ?? 0) >= (account?.targetAmount ?? 0);
          return targetSet && !targetMet ? (
            <View style={styles.targetNotice}>
              <Ionicons name="lock-closed" size={16} color="#92400e" />
              <Text style={styles.targetNoticeText}>
                Withdrawals are disabled until your savings goal of {ngn(account?.targetAmount ?? 0)} is met.
              </Text>
            </View>
          ) : null;
        })()}

        <View style={sectionCardStyle}>
          <View style={styles.vaCardHeader}>
            <View style={styles.vaIcon}>
              <Ionicons name="business-outline" size={20} color="#0F766E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaTitle}>Your bank transfer account</Text>
              <Text style={styles.vaSub}>Fund savings anytime via a normal bank transfer.</Text>
            </View>
          </View>
          {virtualAccount && (
            <View style={styles.vaRow}>
              <View>
                <Text style={styles.vaLabel}>{virtualAccount.bankName}</Text>
                <Text style={styles.vaNumber}>{virtualAccount.accountNumber}</Text>
                <Text style={styles.vaName}>{virtualAccount.accountName}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={() => copyNumber(virtualAccount.accountNumber)}>
                <Ionicons name={copied === virtualAccount.accountNumber ? 'checkmark' : 'copy-outline'} size={16} color="#0F766E" />
                <Text style={styles.copyBtnText}>{copied === virtualAccount.accountNumber ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {(['deposit', 'withdraw', 'target'] as Exclude<ActionType, null>[]).map((a) => {
            const targetSet = (account?.targetAmount ?? 0) > 0;
            const targetMet = targetSet && (account?.goalBalance ?? 0) >= (account?.targetAmount ?? 0);
            const disabled = a === 'withdraw' && targetSet && !targetMet;
            return (
              <TouchableOpacity
                key={a}
                style={[styles.actionBtn, isIOS && styles.actionBtnGlass, disabled && styles.actionBtnDisabled]}
                disabled={disabled}
                onPress={() => { setModal(a); setAmount(''); setDepositType('general'); }}
              >
                <Ionicons name={actionMeta[a].icon} size={22} color={disabled ? (isIOS ? 'rgba(255,255,255,0.4)' : '#9ca3af') : actionMeta[a].color} />
                <Text style={[styles.actionBtnText, isIOS && styles.actionBtnTextGlass, disabled && styles.actionBtnTextDisabled]}>
                  {a === 'target' ? 'Set Target' : a.charAt(0).toUpperCase() + a.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, isIOS && styles.sectionTitleGlass]}>Transactions</Text>
        {txns.length === 0 && !loading && (
          <Text style={[styles.emptyText, isIOS && styles.emptyTextGlass]}>No transactions yet</Text>
        )}
        {txns.slice(0, 20).map((t) => (
          <View key={t.id} style={[styles.txnRow, isIOS && styles.txnRowGlass]}>
            <View style={styles.txnInfo}>
              <Text style={[styles.txnType, isIOS && styles.txnTypeGlass]}>
                {t.type === 'interest' ? 'Interest' : t.type === 'withdrawal' ? 'Withdrawal' : 'Deposit'}
              </Text>
              <Text style={[styles.txnDesc, isIOS && styles.txnDescGlass]} numberOfLines={1}>{t.description || 'Savings transaction'}</Text>
            </View>
            <View style={styles.txnRight}>
              <Text style={[styles.txnDate, isIOS && styles.txnDateGlass]}>{new Date(t.createdAt).toLocaleDateString('en-NG')}</Text>
              <Text style={[styles.txnStatus, { color: (t.type === 'deposit' || t.type === 'interest') ? '#4ADE80' : '#FACC15' }]}>
                {t.status || (t.type === 'deposit' || t.type === 'interest' ? 'credited' : 'completed')}
              </Text>
            </View>
            <Text style={[styles.txnAmount, t.type === 'deposit' || t.type === 'interest' ? styles.green : styles.red]}>
              {t.type === 'deposit' || t.type === 'interest' ? '+' : '-'}{ngn(Number(t.amount))}
            </Text>
          </View>
        ))}

        {renderInstructionModal()}
        {renderActionModal()}
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
  header: { padding: 20, paddingTop: 12, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 18 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  balanceItem: { alignItems: 'center', flex: 1 },
  balanceLabel: { color: '#9FB8C8', fontSize: 13, fontWeight: '500' },
  balanceValue: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 6 },
  balanceDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.18)' },
  progressWrap: { marginTop: 18 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  progressPct: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  progressTrack: { width: '100%', backgroundColor: '#374151', borderRadius: 6, height: 10, overflow: 'hidden' },
  progressTrackGlass: { backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', backgroundColor: '#4ADE80', borderRadius: 6, position: 'absolute' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#dcfce7', padding: 12, marginHorizontal: 20, marginTop: 8, borderRadius: 14 },
  noticeText: { color: '#166534', fontWeight: '600', flex: 1 },
  targetNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', padding: 12, marginHorizontal: 20, marginTop: 8, borderRadius: 14 },
  targetNoticeText: { color: '#92400e', fontWeight: '500', fontSize: 13, flex: 1 },
  sectionGlass: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 20, marginTop: 16, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  sectionM3: {
    backgroundColor: '#F6F3EB',
    marginHorizontal: 20, marginTop: 16, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  vaCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vaIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15,118,110,0.12)',
  },
  vaTitle: { fontSize: 15, fontWeight: '700', color: '#173F38' },
  vaTitleGlass: {},
  vaSub: { fontSize: 12, color: '#627084', marginTop: 2 },
  vaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  vaLabel: { fontSize: 13, color: '#627084', fontWeight: '500' },
  vaNumber: { fontSize: 22, fontWeight: '800', color: '#173F38', letterSpacing: 1.5, marginTop: 2 },
  vaName: { fontSize: 13, color: '#334155', marginTop: 2 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E5EDEA', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  copyBtnText: { color: '#0F766E', fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 10 },
  actionBtn: {
    flex: 1, borderRadius: 18, paddingVertical: 14, alignItems: 'center', gap: 6,
    backgroundColor: '#F6F3EB',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  actionBtnGlass: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#173F38', fontWeight: '700', fontSize: 14 },
  actionBtnTextGlass: { color: '#ffffff' },
  actionBtnTextDisabled: { color: '#9ca3af' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#173F38', paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },
  sectionTitleGlass: { color: '#ffffff' },
  emptyText: { fontSize: 13, color: '#627084', paddingHorizontal: 20, paddingBottom: 10 },
  emptyTextGlass: { color: 'rgba(255,255,255,0.65)' },
  txnRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F6F3EB', paddingVertical: 14, paddingHorizontal: 16,
    marginHorizontal: 20, marginBottom: 8, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  txnRowGlass: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  txnInfo: { flex: 1, minWidth: 0 },
  txnType: { fontSize: 11, fontWeight: '700', color: '#627084', textTransform: 'uppercase' },
  txnTypeGlass: { color: 'rgba(255,255,255,0.65)' },
  txnDesc: { fontSize: 13, color: '#173F38', marginTop: 1 },
  txnDescGlass: { color: '#ffffff' },
  txnDate: { fontSize: 11, color: '#94a3b8' },
  txnDateGlass: { color: 'rgba(255,255,255,0.55)' },
  txnRight: { alignItems: 'flex-end', marginHorizontal: 12 },
  txnStatus: { fontSize: 11, marginTop: 1, textTransform: 'capitalize', fontWeight: '600' },
  txnAmount: { fontSize: 15, fontWeight: '700', minWidth: 90, textAlign: 'right' },
  green: { color: '#4ADE80' },
  red: { color: '#F87171' },
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
  typeToggle: { flexDirection: 'row', backgroundColor: '#E5EDEA', borderRadius: 12, marginBottom: 12, padding: 4 },
  typeBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 9 },
  typeBtnActive: { backgroundColor: '#173F38' },
  typeBtnText: { color: '#627084', fontWeight: '600', fontSize: 14 },
  typeBtnTextActive: { color: '#fff' },
  modalInput: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 15, fontSize: 16, marginBottom: 20,
    borderWidth: 1.5, borderColor: '#E2E8F0', color: '#173F38',
  },
  depositHint: { fontSize: 13, color: '#627084', marginBottom: 16 },
  instructionNote: { fontSize: 14, color: '#475569', marginBottom: 16, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#173F38' },
  vaBox: { backgroundColor: '#E5EDEA', borderRadius: 16, padding: 16, marginBottom: 12 },
  vaNumberBig: { fontSize: 24, fontWeight: '800', color: '#173F38', letterSpacing: 1.5, marginTop: 4 },
  vaRef: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  instructionMeta: { fontSize: 13, color: '#627084', marginBottom: 16, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#E5EDEA', alignItems: 'center' },
  cancelText: { color: '#475569', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#173F38', alignItems: 'center' },
  submitText: { color: '#ffffff', fontWeight: '700' },
});