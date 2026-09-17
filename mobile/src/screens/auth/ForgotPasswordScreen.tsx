import { useState } from 'react';
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
} from 'react-native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import DesignCredit from '../../ui/DesignCredit';

export default function ForgotPasswordScreen({ navigation }: { navigation: any }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    if (!emailOrPhone.trim()) {
      setError('Enter your email or phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await client.post(ENDPOINTS.auth.forgotPassword, {
        emailOrPhone: emailOrPhone.trim(),
      });
      setStep(2);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Could not send the reset code. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!token.trim()) {
      setError('Enter the reset code you received.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await client.post(ENDPOINTS.auth.resetPassword, {
        emailOrPhone: emailOrPhone.trim(),
        token: token.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid or expired reset code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === 1 && 'Enter the email or phone number on your account and we\'ll send you a reset code.'}
          {step === 2 && `Enter the reset code sent to ${emailOrPhone}.`}
          {step === 3 && 'Your password has been reset.'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === 1 && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email or phone"
              placeholderTextColor="#999"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              autoComplete="email"
            />
            <TouchableOpacity style={styles.button} onPress={sendCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Reset code"
              placeholderTextColor="#999"
              value={token}
              onChangeText={setToken}
              autoCapitalize="characters"
            />
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, { marginBottom: 0, paddingRight: 64 }]}
                placeholder="New password (8+ characters)"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.showBtn}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        )}

        {step !== 3 && (
          <TouchableOpacity onPress={() => { setStep(1); setError(''); }}>
            <Text style={styles.link}>Back to Login</Text>
          </TouchableOpacity>
        )}

        <DesignCredit />
      </ScrollView>
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
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  error: { color: '#dc2626', fontSize: 14, marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordWrap: { position: 'relative', marginBottom: 16 },
  showBtn: { position: 'absolute', right: 16, top: 14 },
  showBtnText: { color: '#1a1a2e', fontSize: 14, fontWeight: '600' },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 24, color: '#1a1a2e', fontSize: 14, fontWeight: '600' },
});