import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';

export default function ReferralsScreen() {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<{ count: number; earnings: number } | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [c, s, r] = await Promise.all([
          client.get(ENDPOINTS.users.referralCode),
          client.get(ENDPOINTS.users.referralStats),
          client.get(ENDPOINTS.users.referrals),
        ]);
        setCode(c.data.referralCode);
        setStats(s.data);
        setReferrals(Array.isArray(r.data) ? r.data : []);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const shareCode = async () => {
    await Share.share({ message: `Join Coop BNPL using my referral code: ${code}` });
  };

  const sendInvite = async () => {
    if (!email) { Alert.alert('Error', 'Enter an email'); return; }
    try {
      await client.post(ENDPOINTS.users.referrals, { refereeEmail: email });
      Alert.alert('Success', 'Invitation sent');
      setEmail('');
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Failed'); }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.code}>{code || '---'}</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={shareCode}>
          <Text style={styles.shareBtnText}>Share Code</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.count}</Text><Text style={styles.statLabel}>Friends</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>₦{Number(stats.earnings).toLocaleString()}</Text><Text style={styles.statLabel}>Earnings</Text></View>
        </View>
      )}

      <View style={styles.inviteSection}>
        <Text style={styles.sectionTitle}>Invite a Friend</Text>
        <TextInput style={styles.input} placeholder="Friend's email" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={styles.inviteBtn} onPress={sendInvite}>
          <Text style={styles.inviteBtnText}>Send Invitation</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Invitation History ({referrals.length})</Text>
      {referrals.map((r, i) => (
        <View key={i} style={styles.referralRow}>
          <Text style={styles.refereeEmail}>{r.refereeEmail || r.email}</Text>
          <Text style={[styles.referralStatus, { color: r.status === 'joined' ? '#22c55e' : '#eab308' }]}>{r.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  codeSection: { backgroundColor: '#1a1a2e', padding: 24, alignItems: 'center' },
  codeLabel: { color: '#9ca3af', fontSize: 14 },
  code: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginVertical: 12 },
  shareBtn: { backgroundColor: '#374151', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  shareBtnText: { color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  inviteSection: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  inviteBtn: { backgroundColor: '#1a1a2e', padding: 14, borderRadius: 8, alignItems: 'center' },
  inviteBtnText: { color: '#fff', fontWeight: '600' },
  referralRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 1 },
  refereeEmail: { fontSize: 14, color: '#1a1a2e' },
  referralStatus: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
});
