import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import client from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigation = useNavigation<any>();

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { Alert.alert('Error', 'Fill all fields'); return; }
    if (newPassword.length < 8) { Alert.alert('Error', 'Password must be 8+ characters'); return; }
    setSubmitting(true);
    try {
      await client.patch(ENDPOINTS.users.changePassword, { currentPassword, newPassword });
      Alert.alert('Success', 'Password updated');
      setShowPassword(false); setCurrentPassword(''); setNewPassword('');
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleSaveNotifPrefs = async () => {
    try {
      await client.patch(ENDPOINTS.users.notificationPreferences, { email: emailNotifs, push: pushNotifs });
      Alert.alert('Success', 'Preferences saved');
      setShowNotifPrefs(false);
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Failed'); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { label: 'Savings', screen: 'Savings' },
    { label: 'Loans', screen: 'Loans' },
    { label: 'Investments', screen: 'Investments' },
    { label: 'Portfolio', screen: 'Portfolio' },
    { label: 'Distributions', screen: 'Distributions' },
    { label: 'Redemptions', screen: 'Redemptions' },
    { label: 'Repayments', screen: 'Repayments' },
    { label: 'Payment Methods', screen: 'PaymentMethods' },
    { label: 'Transactions', screen: 'Transactions' },
    { label: 'Activity Log', screen: 'ActivityLog' },
    { label: 'Support Tickets', screen: 'SupportTickets' },
    { label: 'Referrals', screen: 'Referrals' },
    { label: 'Notifications', screen: 'Notifications' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}{user?.lastName?.charAt(0)?.toUpperCase() || ''}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <InfoRow label="Role" value={user?.role?.replace('_', ' ') || ''} />
        <InfoRow label="KYC Status" value={user?.kycStatus || 'none'} />
        <InfoRow label="Phone" value={user?.phone || 'Not set'} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPassword(true)}>
          <Text style={styles.actionBtnText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowNotifPrefs(true)}>
          <Text style={styles.actionBtnText}>Notification Preferences</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.screen} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
            <Text style={styles.menuItemText}>{item.label}</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={showPassword} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput style={styles.input} placeholder="Current password" placeholderTextColor="#999" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="New password (8+ chars)" placeholderTextColor="#999" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPassword(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showNotifPrefs} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Notification Preferences</Text>
            <TouchableOpacity style={styles.toggleRow} onPress={() => setEmailNotifs(!emailNotifs)}>
              <Text style={styles.toggleLabel}>Email Notifications</Text>
              <Text style={[styles.toggleVal, { color: emailNotifs ? '#22c55e' : '#999' }]}>{emailNotifs ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleRow} onPress={() => setPushNotifs(!pushNotifs)}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={[styles.toggleVal, { color: pushNotifs ? '#22c55e' : '#999' }]}>{pushNotifs ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNotifPrefs(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveNotifPrefs}><Text style={styles.submitText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  actions: { flexDirection: 'row', padding: 16, gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#1a1a2e', padding: 14, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  menu: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuItemText: { fontSize: 15, color: '#1a1a2e' },
  menuArrow: { fontSize: 16, color: '#999' },
  logoutButton: { margin: 16, backgroundColor: '#dc3545', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8 },
  toggleLabel: { fontSize: 16, color: '#1a1a2e' },
  toggleVal: { fontSize: 16, fontWeight: '600' },
});
