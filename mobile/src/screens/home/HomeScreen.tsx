import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { DashboardData, UnifiedTransaction } from '../../types';
import AdBanner from '../../components/AdBanner';
import { useBranding } from '../../hooks/useBranding';
import { colors } from '../../ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const quickActions: { key: string; label: string; icon: IconName; screen: string }[] = [
  { key: 'Savings', label: 'Savings', icon: 'wallet-outline', screen: 'Savings' },
  { key: 'Loans', label: 'Loans', icon: 'cash-outline', screen: 'Loans' },
  { key: 'Investments', label: 'Investments', icon: 'trending-up-outline', screen: 'Investments' },
  { key: 'Repayments', label: 'Repayments', icon: 'calendar-outline', screen: 'Repayments' },
];

const quickColors: Record<string, string> = {
  Savings: '#0F766E',
  Loans: '#2563EB',
  Investments: '#7C3AED',
  Repayments: '#D97706',
};

export default function HomeScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const branding = useBranding();
  const [data, setData] = useState<DashboardData | null>(null);
  const [txns, setTxns] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const isIOS = Platform.OS === 'ios';
  const { height } = useWindowDimensions();
  const compact = height < 720;

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: res } = await client.get(ENDPOINTS.dashboard.individual);
      setData(res);
    } catch { /* ignore */ }
    try {
      const { data: tx } = await client.get(ENDPOINTS.dashboard.transactions);
      setTxns(Array.isArray(tx) ? tx.slice(0, 5) : []);
    } catch { /* ignore */ }
    finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDashboard(); }, [fetchDashboard]));

  const ngn = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

  const kycColors: Record<string, string> = {
    approved: '#22c55e', pending: '#eab308', rejected: '#ef4444', none: '#9ca3af',
  };

  const savingsProgress = data && data.savingsTarget > 0
    ? Math.min(100, (data.goalBalance / data.savingsTarget) * 100)
    : 0;

  const bnplPercent = data && data.bnplCreditLimit > 0 ? (data.bnplUsed / data.bnplCreditLimit) * 100 : 0;

  const kycBanner = () => {
    const kyc = data?.kycStatus ?? user?.kycStatus;
    if (!kyc) return null;
    if (kyc === 'approved') {
      return (
        <View style={styles.kycBanner}>
          <Ionicons name="shield-checkmark" size={16} color="#166534" />
          <Text style={[styles.kycBannerText, { color: '#166534' }]}>KYC verified</Text>
        </View>
      );
    }
    const isPending = kyc === 'pending';
    const isRejected = kyc === 'rejected';
    const accent = isRejected ? '#b91c1c' : isPending ? '#075985' : '#92400e';
    const bg = isRejected ? 'rgba(254,226,226,0.9)' : isPending ? 'rgba(224,242,254,0.9)' : 'rgba(254,243,199,0.9)';
    return (
      <TouchableOpacity
        style={[styles.kycBanner, { backgroundColor: bg }]}
        onPress={() => navigation.navigate('KYCVerification')}
      >
        <Ionicons name={isRejected ? 'alert-circle' : isPending ? 'time' : 'information-circle'} size={16} color={accent} />
        <Text style={[styles.kycBannerText, { color: accent }]}>
          {kyc === 'none' ? 'Complete your KYC verification to access all features' :
           isPending ? 'KYC verification pending review' :
           'KYC verification rejected. Tap to retry'}
        </Text>
      </TouchableOpacity>
    );
  };

  const sectionCardStyle = [isIOS ? styles.sectionGlass : styles.sectionM3];
  const sectionTitleStyle = [styles.sectionTitle, isIOS && styles.sectionTitleGlass];

  return (
    <LinearGradient
      colors={isIOS ? ['#0A1F1C', '#123A34', '#173F38'] : ['#0E342C', '#173F38', '#1D4A3F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={[styles.blob, styles.blobGold, { top: -100, right: -70 }]} />
      <View style={[styles.blob, styles.blobTeal, { top: '38%', left: -80 }]} />
      <View style={[styles.blob, styles.blobOrange, { bottom: '6%', right: -60 }]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} tintColor="#8AB6D6" colors={['#8AB6D6']} accessibilityLabel="Refresh dashboard" />}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greeting}>Welcome, {user?.firstName || 'User'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              {branding?.organizationName && branding.organizationName !== 'Coop BNPL' ? (
                <Text style={styles.orgName}>{branding.organizationName}</Text>
              ) : null}
            </View>
            <View style={[styles.avatar, isIOS && styles.avatarGlass]}>
              <Text style={styles.avatarText}>{(user?.firstName || 'U').charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {kycBanner()}

        <View style={styles.quickActions}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.key}
              accessibilityRole="button"
              style={[styles.quickAction, isIOS && styles.quickActionGlass]}
              onPress={() => navigation.navigate('Profile', { screen: a.screen, params: a.key === 'Withdraw' ? { openWithdraw: true } : undefined })}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${quickColors[a.key]}1A` }]}>
                <Ionicons name={a.icon} size={22} color={quickColors[a.key]} />
              </View>
              <Text style={[styles.quickLabel, isIOS && styles.quickLabelGlass]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cardsRow}>
          <TouchableOpacity style={[styles.card, isIOS && styles.cardGlass]} onPress={() => navigation.navigate('Subscriptions')}>
            <View style={styles.cardIconRow}>
              <View style={[styles.cardIconChip, !isIOS && styles.cardIconChipM3]}>
                <Ionicons name="layers-outline" size={14} color={quickColors.Savings} />
              </View>
              <Text style={[styles.cardValue, !isIOS && styles.cardValueM3]}>{data?.activeSubscriptions ?? 0}</Text>
            </View>
            <Text style={[styles.cardLabel, isIOS && styles.cardLabelGlass]}>Active Subscriptions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, isIOS && styles.cardGlass]} onPress={() => navigation.navigate('Profile', { screen: 'Repayments' })}>
            <View style={styles.cardIconRow}>
              <View style={[styles.cardIconChip, !isIOS && styles.cardIconChipM3]}>
                <Ionicons name="calendar-outline" size={14} color={quickColors.Repayments} />
              </View>
              <Text style={[styles.cardValue, !isIOS && styles.cardValueM3]}>{data?.nextPaymentAmount ? ngn(data.nextPaymentAmount) : '₦0'}</Text>
            </View>
            <Text style={[styles.cardLabel, isIOS && styles.cardLabelGlass]}>Next Payment</Text>
            <Text style={[styles.cardSub, isIOS && styles.cardSubGlass]}>
              {data?.nextPaymentDate ? `Due ${new Date(data.nextPaymentDate).toLocaleDateString()}` : 'No upcoming'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={sectionCardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={sectionTitleStyle}>Savings</Text>
            <Ionicons name="wallet-outline" size={16} color={isIOS ? 'rgba(255,255,255,0.6)' : '#64748b'} />
          </View>
          <View style={styles.row}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isIOS && styles.statValueGlass]}>{ngn(data?.savingsBalance ?? 0)}</Text>
              <Text style={[styles.statLabel, isIOS && styles.statLabelGlass]}>General</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isIOS && styles.statValueGlass]}>{ngn(data?.goalBalance ?? 0)}</Text>
              <Text style={[styles.statLabel, isIOS && styles.statLabelGlass]}>Goal</Text>
            </View>
          </View>
          {data && data.savingsTarget > 0 ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, isIOS && styles.progressLabelGlass]}>Target: {ngn(data.savingsTarget)}</Text>
                <Text style={[styles.progressPct, isIOS && styles.progressLabelGlass]}>{Math.round(savingsProgress)}%</Text>
              </View>
              <View style={[styles.progressTrack, isIOS && styles.progressTrackGlass]}>
                <View style={[styles.progressFill, { width: `${savingsProgress}%` }]} />
              </View>
            </View>
          ) : null}
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Profile', { screen: 'Savings' })}>
            <Text style={[styles.linkText, isIOS && styles.linkTextGlass]}>Manage Savings →</Text>
          </TouchableOpacity>
        </View>

        <View style={sectionCardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={sectionTitleStyle}>Loans</Text>
            <Ionicons name="cash-outline" size={16} color={isIOS ? 'rgba(255,255,255,0.6)' : '#64748b'} />
          </View>
          <View style={styles.row}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isIOS && styles.statValueGlass]}>{data?.activeLoans ?? 0}</Text>
              <Text style={[styles.statLabel, isIOS && styles.statLabelGlass]}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isIOS && styles.statValueGlass]}>{ngn(data?.totalOutstanding ?? 0)}</Text>
              <Text style={[styles.statLabel, isIOS && styles.statLabelGlass]}>Outstanding</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Profile', { screen: 'Loans' })}>
            <Text style={[styles.linkText, isIOS && styles.linkTextGlass]}>Apply / View Loans →</Text>
          </TouchableOpacity>
        </View>

        <View style={sectionCardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={sectionTitleStyle}>BNPL Available Credit</Text>
            <Ionicons name="cart-outline" size={16} color={isIOS ? 'rgba(255,255,255,0.6)' : '#64748b'} />
          </View>
          {data && !data.bnplEligible ? (
            <>
              <Text style={[styles.statValue, isIOS && styles.statValueGlass]}>Not yet eligible</Text>
              <Text style={[styles.statLabel, isIOS && styles.statLabelGlass]}>Save consistently to unlock BNPL credit</Text>
            </>
          ) : (
            <>
              <Text style={[styles.statValue, { color: isIOS ? '#C4B5FD' : '#7C3AED' }]}>{data ? ngn(data.bnplAvailable) : '—'}</Text>
              {data && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, isIOS && styles.progressLabelGlass]}>{ngn(data.bnplUsed)} used</Text>
                    <Text style={[styles.progressPct, isIOS && styles.progressLabelGlass]}>Limit: {ngn(data.bnplCreditLimit)}</Text>
                  </View>
                  <View style={[styles.progressTrack, isIOS && styles.progressTrackGlass]}>
                    <View style={[styles.progressFillPurple, { width: `${bnplPercent}%` }]} />
                  </View>
                </View>
              )}
            </>
          )}
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Catalog')}>
            <Text style={[styles.linkText, isIOS && styles.linkTextGlass]}>Shop Now →</Text>
          </TouchableOpacity>
        </View>

        <View style={sectionCardStyle}>
          <View style={styles.activityHeader}>
            <Text style={sectionTitleStyle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Transactions' })}>
              <Text style={[styles.linkText, isIOS && styles.linkTextGlass]}>View All</Text>
            </TouchableOpacity>
          </View>
          {txns.length === 0 && <Text style={[styles.emptyText, isIOS && styles.emptyTextGlass]}>No transactions yet</Text>}
          {txns.map((t, i) => (
            <View key={`${t.reference}-${i}`} style={[styles.txnRow, isIOS && styles.txnRowGlass]}>
              <View style={styles.left}>
                <View style={[styles.dot, { backgroundColor: typeColors[t.type] || '#666' }]} />
                <View style={styles.leftText}>
                  <Text style={[styles.txnType, isIOS && styles.txnTypeGlass]}>{(typeLabels[t.type] ?? t.type.replace(/_/g, ' '))}</Text>
                  <Text style={[styles.txnDesc, isIOS && styles.txnDescGlass]} numberOfLines={1}>{t.description || t.reference}</Text>
                  <Text style={[styles.txnDate, isIOS && styles.txnDateGlass]}>{new Date(t.date).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <Text style={[styles.amount, { color: t.amount >= 0 ? '#4ADE80' : '#F87171' }]}>
                  {t.amount >= 0 ? '+' : ''}{ngn(Math.abs(t.amount))}
                </Text>
                <Text style={[styles.status, { color: t.status === 'success' || t.status === 'paid' || t.status === 'completed' ? '#4ADE80' : t.status === 'pending' || t.status === 'overdue' ? '#FACC15' : '#F87171' }]}>{t.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <AdBanner />
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const typeColors: Record<string, string> = {
  savings_deposit: '#4ADE80', savings_withdrawal: '#F87171', savings_interest: '#4ADE80',
  payment: '#60A5FA', installment: '#C4B5FD', loan_due: '#FACC15', loan_repayment: '#4ADE80',
};

const typeLabels: Record<string, string> = {
  savings_deposit: 'Savings Deposit', savings_withdrawal: 'Savings Withdrawal', savings_interest: 'Savings Interest',
  payment: 'Subscription Payment', installment: 'Installment Due', loan_due: 'Loan Due', loan_repayment: 'Loan Repayment',
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  blobGold: { backgroundColor: 'rgba(228,164,42,0.16)' },
  blobTeal: { backgroundColor: 'rgba(56,180,150,0.14)' },
  blobOrange: { backgroundColor: 'rgba(200,91,35,0.14)' },
  content: { paddingBottom: 32 },
  contentCompact: { paddingBottom: 20 },
  header: { padding: 20, paddingTop: 12, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTextWrap: { flex: 1, paddingRight: 12 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  email: { fontSize: 13, color: '#C9DCE8', marginTop: 4 },
  orgName: { fontSize: 12, color: '#9FB8C8', marginTop: 2, fontWeight: '500' },
  avatar: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarGlass: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#173F38' },
  kycBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, marginHorizontal: 20, marginTop: 4, borderRadius: 14 },
  kycBannerText: { fontSize: 13, textAlign: 'center', flexShrink: 1, fontWeight: '500' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 10 },
  quickAction: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F3EB',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  quickActionGlass: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: '#173F38' },
  quickLabelGlass: { color: '#ffffff' },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 14 },
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F6F3EB',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardGlass: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardIconChip: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cardIconChipM3: { backgroundColor: '#EDE9DE', borderWidth: 1, borderColor: '#E2DCCB' },
  cardValue: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  cardValueM3: { color: '#173F38' },
  cardLabel: { fontSize: 13, color: '#173F38', marginTop: 2, fontWeight: '600' },
  cardLabelGlass: { color: '#DCECF7' },
  cardSub: { fontSize: 11, color: '#627084', marginTop: 3 },
  cardSubGlass: { color: 'rgba(255,255,255,0.6)' },
  section: {},
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#173F38', marginBottom: 12 },
  sectionTitleGlass: { color: '#ffffff', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 16 },
  statItem: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#122033' },
  statValueGlass: { color: '#ffffff' },
  statLabel: { fontSize: 13, color: '#627084', marginTop: 2 },
  statLabelGlass: { color: 'rgba(255,255,255,0.65)' },
  green: { color: '#4ADE80' },
  red: { color: '#F87171' },
  link: { marginTop: 12 },
  linkText: { color: '#0F766E', fontSize: 14, fontWeight: '700' },
  linkTextGlass: { color: '#8FD8C0' },
  progressWrap: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, color: '#627084' },
  progressLabelGlass: { color: 'rgba(255,255,255,0.7)' },
  progressPct: { fontSize: 12, color: '#627084' },
  progressTrack: { width: '100%', backgroundColor: '#E2E8F0', borderRadius: 4, height: 8, overflow: 'hidden' },
  progressTrackGlass: { backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: 8, backgroundColor: '#0F766E', borderRadius: 4 },
  progressFillPurple: { height: 8, backgroundColor: '#7C3AED', borderRadius: 4 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#627084', paddingVertical: 8 },
  emptyTextGlass: { color: 'rgba(255,255,255,0.65)' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  txnRowGlass: { borderTopColor: 'rgba(255,255,255,0.15)' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  leftText: { flex: 1 },
  txnType: { fontSize: 14, fontWeight: '600', color: '#122033', textTransform: 'capitalize' },
  txnTypeGlass: { color: '#ffffff' },
  txnDesc: { fontSize: 12, color: '#627084', marginTop: 1 },
  txnDescGlass: { color: 'rgba(255,255,255,0.6)' },
  txnDate: { fontSize: 11, color: '#627084', marginTop: 1 },
  txnDateGlass: { color: 'rgba(255,255,255,0.5)' },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  amount: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});
