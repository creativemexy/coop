import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { colors, layout } from '../../ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;
type MenuLink = { label: string; description: string; screen: string; icon: IconName };

const accountLinks: MenuLink[] = [
  { label: 'Payment methods', description: 'Cards and bank accounts', screen: 'PaymentMethods', icon: 'card-outline' },
  { label: 'Transactions', description: 'Your complete money history', screen: 'Transactions', icon: 'swap-horizontal-outline' },
  { label: 'Notifications', description: 'Messages and reminders', screen: 'Notifications', icon: 'notifications-outline' },
  { label: 'Help & support', description: 'Get help with your account', screen: 'SupportTickets', icon: 'help-circle-outline' },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const biometricRequired = useAuthStore((s) => s.biometricRequired);
  const setBiometricRequired = useAuthStore((s) => s.setBiometricRequired);
  const navigation = useNavigation<any>();
  const [showPassword, setShowPassword] = useState(false);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return Alert.alert('Enter both passwords', 'Fill in your current password and a new password.');
    if (newPassword.length < 8) return Alert.alert('Choose a longer password', 'Your new password needs at least 8 characters.');
    setSubmitting(true);
    try {
      await client.patch(ENDPOINTS.users.changePassword, { currentPassword, newPassword });
      setShowPassword(false); setCurrentPassword(''); setNewPassword('');
      Alert.alert('Password updated', 'Your account is now protected with the new password.');
    } catch (error: any) { Alert.alert('Could not update password', getErrorMessage(error, 'Please try again.')); }
    finally { setSubmitting(false); }
  };

  const savePreferences = async () => {
    try {
      await client.patch(ENDPOINTS.users.notificationPreferences, { email: emailNotifs, push: pushNotifs });
      setShowNotifPrefs(false);
      Alert.alert('Preferences saved', 'We will use your updated notification choices.');
    } catch (error: any) { Alert.alert('Could not save preferences', getErrorMessage(error, 'Please try again.')); }
  };

  const toggleBiometricLogin = async () => {
    if (biometricRequired) {
      setBiometricRequired(false);
      Alert.alert('Biometric login disabled', 'You will sign in with your password.');
      return;
    }
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Not available', 'This device does not support biometric authentication.');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Not set up', 'Set up Face ID, fingerprint or PIN in your device settings first.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login for Coop BNPL',
        fallbackLabel: 'Use Device PIN',
      });
      if (!result.success) return;
      setBiometricRequired(true);
      Alert.alert('Biometric login enabled', 'You can unlock the app with your face, voice or fingerprint.');
    } catch { Alert.alert('Error', 'Could not enable biometric login. Please try again.'); }
  };

  const kycVerified = user?.kycStatus === 'approved';
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.firstName?.[0]?.toUpperCase() || 'U'}{user?.lastName?.[0]?.toUpperCase() || ''}</Text></View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.identity}><Ionicons name={kycVerified ? 'shield-checkmark-outline' : 'alert-circle-outline'} size={15} color={kycVerified ? colors.success : colors.warning} /><Text style={styles.identityText}>{kycVerified ? 'Identity verified' : 'Identity verification needed'}</Text></View>
      </View>

      <Text style={styles.groupTitle}>Account</Text>
      <View style={styles.menu}>
        {accountLinks.map((item) => <MenuItem key={item.screen} {...item} onPress={() => navigation.navigate(item.screen)} />)}
        <MenuItem label="Security" description="Change your account password" icon="lock-closed-outline" onPress={() => setShowPassword(true)} />
        <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: biometricRequired }} style={styles.menuItem} onPress={toggleBiometricLogin}>
          <View style={styles.menuLead}>
            <View style={styles.menuIcon}><Ionicons name="scan-outline" size={21} color={colors.brand} /></View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuLabel}>Biometric login</Text>
              <Text style={styles.menuDescription}>{biometricRequired ? 'Enabled — unlock with Face ID / fingerprint' : 'Disabled'}</Text>
            </View>
          </View>
          <View style={[styles.switchTrack, biometricRequired && styles.switchTrackOn]}><View style={[styles.switchThumb, biometricRequired && styles.switchThumbOn]} /></View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity accessibilityRole="button" style={styles.settingsButton} onPress={() => setShowNotifPrefs(true)}><Ionicons name="settings-outline" size={19} color={colors.brand} /><Text style={styles.settingsText}>Notification settings</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.logoutButton} onPress={() => Alert.alert('Log out?', 'You can sign in again at any time.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>

      <Modal visible={showPassword} transparent animationType="slide" onRequestClose={() => setShowPassword(false)}>
        <View style={styles.modalOverlay}><View style={styles.modal}><Text style={styles.modalTitle}>Change password</Text><Text style={styles.modalBody}>Use a strong password you do not use elsewhere.</Text><TextInput style={styles.input} placeholder="Current password" placeholderTextColor={colors.muted} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry /><TextInput style={styles.input} placeholder="New password (8+ characters)" placeholderTextColor={colors.muted} value={newPassword} onChangeText={setNewPassword} secureTextEntry /><ModalActions onCancel={() => setShowPassword(false)} onSubmit={handleChangePassword} submitting={submitting} label="Save password" /></View></View>
      </Modal>
      <Modal visible={showNotifPrefs} transparent animationType="slide" onRequestClose={() => setShowNotifPrefs(false)}>
        <View style={styles.modalOverlay}><View style={styles.modal}><Text style={styles.modalTitle}>Notification settings</Text><Text style={styles.modalBody}>Choose how you would like to hear from us.</Text><PreferenceRow label="Email notifications" value={emailNotifs} onPress={() => setEmailNotifs((v) => !v)} /><PreferenceRow label="Push notifications" value={pushNotifs} onPress={() => setPushNotifs((v) => !v)} /><ModalActions onCancel={() => setShowNotifPrefs(false)} onSubmit={savePreferences} label="Save choices" /></View></View>
      </Modal>
    </ScrollView>
  );
}

function MenuItem({ label, description, icon, onPress }: Omit<MenuLink, 'screen'> & { onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label}. ${description}`} style={styles.menuItem} onPress={onPress}><View style={styles.menuLead}><View style={styles.menuIcon}><Ionicons name={icon} size={21} color={colors.brand} /></View><View style={styles.menuCopy}><Text style={styles.menuLabel}>{label}</Text><Text style={styles.menuDescription}>{description}</Text></View></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></TouchableOpacity>;
}

function PreferenceRow({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: value }} style={styles.preference} onPress={onPress}><Text style={styles.preferenceText}>{label}</Text><View style={[styles.switchTrack, value && styles.switchTrackOn]}><View style={[styles.switchThumb, value && styles.switchThumbOn]} /></View></TouchableOpacity>;
}

function ModalActions({ onCancel, onSubmit, submitting = false, label }: { onCancel: () => void; onSubmit: () => void; submitting?: boolean; label: string }) {
  return <View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={onCancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity disabled={submitting} style={styles.submitButton} onPress={onSubmit}><Text style={styles.submitText}>{submitting ? 'Saving…' : label}</Text></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingBottom: 32 },
  header: { alignItems: 'center', backgroundColor: colors.brandDark, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingVertical: 32 }, avatar: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCECF7', marginBottom: 12 }, avatarText: { color: colors.brandDark, fontSize: 27, fontWeight: '800' }, name: { color: '#fff', fontSize: 22, fontWeight: '700' }, email: { color: '#DCECF7', fontSize: 14, marginTop: 4 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff' }, identityText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  groupTitle: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: .5, marginHorizontal: layout.pagePadding, marginTop: 24, marginBottom: 8, textTransform: 'uppercase' }, menu: { backgroundColor: colors.surface, borderRadius: layout.radius, marginHorizontal: layout.pagePadding, overflow: 'hidden', ...layout.shadow }, menuItem: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }, menuLead: { alignItems: 'center', flexDirection: 'row', flex: 1 }, menuIcon: { alignItems: 'center', backgroundColor: '#EAF4FA', borderRadius: 20, height: 40, justifyContent: 'center', marginRight: 12, width: 40 }, menuCopy: { flex: 1 }, menuLabel: { color: colors.text, fontSize: 16, fontWeight: '600' }, menuDescription: { color: colors.muted, fontSize: 13, marginTop: 2 },
  settingsButton: { alignItems: 'center', backgroundColor: '#EAF4FA', borderColor: '#B6D2E5', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginHorizontal: layout.pagePadding, marginTop: 18, minHeight: layout.touchTarget }, settingsText: { color: colors.brand, fontSize: 14, fontWeight: '700' }, logoutButton: { alignItems: 'center', backgroundColor: '#FFF1F2', borderColor: '#F5C2C7', borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginHorizontal: layout.pagePadding, marginTop: 12, minHeight: layout.touchTarget }, logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  modalOverlay: { backgroundColor: 'rgba(2, 20, 35, .55)', flex: 1, justifyContent: 'flex-end' }, modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }, modalTitle: { color: colors.text, fontSize: 21, fontWeight: '700' }, modalBody: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, marginBottom: 12, minHeight: layout.touchTarget, paddingHorizontal: 14 }, preference: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, minHeight: 56, paddingHorizontal: 14 }, preferenceText: { color: colors.text, fontSize: 16, fontWeight: '600' }, switchTrack: { backgroundColor: '#CBD5E1', borderRadius: 16, height: 30, justifyContent: 'center', padding: 3, width: 52 }, switchTrackOn: { backgroundColor: colors.accent }, switchThumb: { backgroundColor: '#fff', borderRadius: 12, height: 24, width: 24 }, switchThumbOn: { alignSelf: 'flex-end' }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 }, cancelButton: { alignItems: 'center', backgroundColor: '#EAF0F5', borderRadius: 12, flex: 1, justifyContent: 'center', minHeight: layout.touchTarget }, cancelText: { color: colors.text, fontWeight: '700' }, submitButton: { alignItems: 'center', backgroundColor: colors.brand, borderRadius: 12, flex: 1.4, justifyContent: 'center', minHeight: layout.touchTarget }, submitText: { color: '#fff', fontWeight: '700' },
});
