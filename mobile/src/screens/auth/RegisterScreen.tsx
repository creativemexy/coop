import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';

interface ApexOrg {
  id: string;
  name: string;
}
interface Org {
  id: string;
  name: string;
  code: string;
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['#999999', '#ef4444', '#f97316', '#eab308', '#22c55e'];

function passwordStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const register = useAuthStore((s) => s.register);

  const [step, setStep] = useState(1);
  const [apexOrgs, setApexOrgs] = useState<ApexOrg[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedApex, setSelectedApex] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apexModal, setApexModal] = useState(false);
  const [orgModal, setOrgModal] = useState(false);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  useEffect(() => {
    client
      .get(ENDPOINTS.registrations.apexOrganizations)
      .then((r) => setApexOrgs(r.data))
      .catch(() => Alert.alert('Error', 'Failed to load apex organizations. Please try again.'));
  }, []);

  useEffect(() => {
    if (selectedApex) {
      client
        .get(`${ENDPOINTS.registrations.organizations}?apexOrgId=${selectedApex}`)
        .then((r) => setOrgs(r.data))
        .catch(() => Alert.alert('Error', 'Failed to load organizations.'));
    } else {
      setOrgs([]);
    }
  }, [selectedApex]);

  const apexName = apexOrgs.find((o) => o.id === selectedApex)?.name;
  const orgName = orgs.find((o) => o.id === selectedOrg)?.name;

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (!form.email && !form.phone) {
      setError('Provide either an email or phone number to log in');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions and Privacy Policy');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const org = orgs.find((o) => o.id === selectedOrg);
      const res = await register({ ...form, organizationCode: org?.code });
      if (res.registrationFeeRequired) {
        navigation.navigate('RegistrationFee', {
          feeAmount: res.registrationFeeAmount,
          pendingUserId: res.pendingUserId,
        });
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {step === 1 ? 'Select Apex' : step === 2 ? 'Select Organization' : 'Your Details'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 3 ? 'Join the cooperative' : 'Create your account'}
        </Text>

        <View style={styles.steps}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.stepCircle,
                step === s ? styles.stepActive : step > s ? styles.stepDone : styles.stepInactive,
              ]}
            >
              <Text style={[styles.stepText, (step === s || step > s) && styles.stepTextActive]}>
                {step > s ? '✓' : s}
              </Text>
            </View>
          ))}
        </View>

        {step === 1 && (
          <View>
            <TouchableOpacity style={styles.input} onPress={() => setApexModal(true)}>
              <Text style={apexName ? styles.pickerValue : styles.pickerPlaceholder}>
                {apexName || 'Choose apex organization'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, !selectedApex && styles.buttonDisabled]}
              disabled={!selectedApex}
              onPress={() => setStep(2)}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <TouchableOpacity style={styles.input} onPress={() => setOrgModal(true)}>
              <Text style={orgName ? styles.pickerValue : styles.pickerPlaceholder}>
                {orgName || 'Choose organization'}
              </Text>
            </TouchableOpacity>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.button, styles.buttonGhost, styles.rowButton]} onPress={() => setStep(1)}>
                <Text style={styles.buttonGhostText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rowButton, !selectedOrg && styles.buttonDisabled]}
                disabled={!selectedOrg}
                onPress={() => setStep(3)}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Apex:</Text> {apexName}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Org:</Text> {orgName}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="First Name *"
              placeholderTextColor="#999"
              value={form.firstName}
              onChangeText={(v) => setForm({ ...form, firstName: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name *"
              placeholderTextColor="#999"
              value={form.lastName}
              onChangeText={(v) => setForm({ ...form, lastName: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="#999"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
            />
            <Text style={styles.emailOrPhoneHint}>
              Provide either an email or phone number (used to log in).
            </Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, { marginBottom: 0, paddingRight: 56 }]}
                placeholder="Password *"
                placeholderTextColor="#999"
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.showBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {form.password ? (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${(strength / 4) * 100}%`, backgroundColor: strengthColors[strength] },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColors[strength] }]}>
                  {strengthLabels[strength] || ''}
                </Text>
              </View>
            ) : null}

            <View style={styles.termsRow}>
              <Switch
                value={termsAccepted}
                onValueChange={setTermsAccepted}
                trackColor={{ false: '#ccc', true: '#1a1a2e' }}
                thumbColor="#fff"
              />
              <Text style={styles.termsText}>
                I accept the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('Terms')}
                >
                  Terms &amp; Conditions
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('Terms')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.row}>
              <TouchableOpacity style={[styles.button, styles.buttonGhost, styles.rowButton]} onPress={() => setStep(2)}>
                <Text style={styles.buttonGhostText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rowButton, (loading || !termsAccepted) && styles.buttonDisabled]}
                disabled={loading || !termsAccepted}
                onPress={handleSubmit}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkWrap}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={apexModal} transparent animationType="slide" onRequestClose={() => setApexModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setApexModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose apex organization</Text>
            {apexOrgs.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.option, selectedApex === o.id && styles.optionActive]}
                onPress={() => {
                  setSelectedApex(o.id);
                  setSelectedOrg('');
                  setOrgModal(false);
                  setApexModal(false);
                }}
              >
                <Text style={[styles.optionText, selectedApex === o.id && styles.optionTextActive]}>{o.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setApexModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={orgModal} transparent animationType="slide" onRequestClose={() => setOrgModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOrgModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose organization</Text>
            {orgs.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.option, selectedOrg === o.id && styles.optionActive]}
                onPress={() => {
                  setSelectedOrg(o.id);
                  setOrgModal(false);
                }}
              >
                <Text style={[styles.optionText, selectedOrg === o.id && styles.optionTextActive]}>{o.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setOrgModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 28 },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: { backgroundColor: '#1a1a2e' },
  stepDone: { backgroundColor: '#22c55e' },
  stepInactive: { backgroundColor: '#e0e0e0' },
  stepText: { fontSize: 15, fontWeight: '600', color: '#666' },
  stepTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerValue: { color: '#1a1a2e', fontSize: 16 },
  pickerPlaceholder: { color: '#999', fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  rowButton: { flex: 1 },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonGhostText: { color: '#1a1a2e', fontSize: 16, fontWeight: '600' },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryText: { fontSize: 13, color: '#666', marginBottom: 4 },
  summaryLabel: { fontWeight: '600', color: '#1a1a2e' },
  passwordWrap: { position: 'relative' },
  showBtn: { position: 'absolute', right: 16, top: 14 },
  showBtnText: { color: '#1a1a2e', fontSize: 14, fontWeight: '600' },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 4 },
  strengthBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 46, textAlign: 'right' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8, marginTop: 4 },
  termsText: { flex: 1, color: '#666', fontSize: 14, marginTop: 6 },
  termsLink: { color: '#1a1a2e', fontWeight: '600' },
  emailOrPhoneHint: { fontSize: 12, color: '#888', marginTop: -8, marginBottom: 16 },
  error: { color: '#dc2626', fontSize: 14, marginBottom: 8 },
  linkWrap: { marginTop: 20 },
  link: { textAlign: 'center', color: '#666', fontSize: 14 },
  linkBold: { color: '#1a1a2e', fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, textAlign: 'center' },
  option: { padding: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#f5f5f5' },
  optionActive: { backgroundColor: '#1a1a2e' },
  optionText: { fontSize: 16, color: '#1a1a2e' },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  modalCancel: { padding: 16, alignItems: 'center' },
  modalCancelText: { color: '#666', fontSize: 16, fontWeight: '600' },
});