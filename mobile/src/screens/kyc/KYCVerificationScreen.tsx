import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { KycStatus } from '../../types';

export default function KYCVerificationScreen() {
  const [kycStatus, setKycStatus] = useState<KycStatus>(KycStatus.NONE);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.kycStatus) {
      setKycStatus(user.kycStatus);
    }
  }, [user]);

  const pickImage = async (type: 'id' | 'selfie') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === 'id') setIdImage(result.assets[0].uri);
      else setSelfieImage(result.assets[0].uri);
    }
  };

  const handleInitiateKYC = async () => {
    if (!idImage || !selfieImage) {
      Alert.alert('Error', 'Please upload both ID and selfie images');
      return;
    }
    setInitiating(true);
    try {
      const { data } = await client.post(ENDPOINTS.kyc.initiate);
      setKycStatus(KycStatus.PENDING);
      Alert.alert('KYC Submitted', 'Your verification is being processed. You will be notified once approved.');
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to initiate KYC'));
    } finally {
      setInitiating(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(ENDPOINTS.kyc.status);
      setKycStatus(data.kycStatus);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (kycStatus) {
      case KycStatus.NONE:
        return { text: 'Not Started', color: '#999' };
      case KycStatus.PENDING:
        return { text: 'Pending Review', color: '#f0ad4e' };
      case KycStatus.APPROVED:
        return { text: 'Approved ✓', color: '#5cb85c' };
      case KycStatus.REJECTED:
        return { text: 'Rejected ✗', color: '#d9534f' };
    }
  };

  const badge = getStatusBadge();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>KYC Verification</Text>
      <Text style={styles.subtitle}>Verify your identity to access all features</Text>

      <View style={[styles.statusBadge, { backgroundColor: badge.color + '20' }]}>
        <Text style={[styles.statusText, { color: badge.color }]}>{badge.text}</Text>
      </View>

      {kycStatus === KycStatus.NONE && (
        <>
          <Text style={styles.sectionTitle}>Upload ID Document</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('id')}>
            {idImage ? (
              <Image source={{ uri: idImage }} style={styles.preview} />
            ) : (
              <Text style={styles.uploadText}>Tap to upload ID (Driver's License, Passport, NIN)</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Upload Selfie</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('selfie')}>
            {selfieImage ? (
              <Image source={{ uri: selfieImage }} style={styles.preview} />
            ) : (
              <Text style={styles.uploadText}>Tap to take a selfie</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (!idImage || !selfieImage) && styles.buttonDisabled]}
            onPress={handleInitiateKYC}
            disabled={initiating || !idImage || !selfieImage}
          >
            {initiating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit for Verification</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {kycStatus === KycStatus.PENDING && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your documents are being reviewed. This usually takes 1-2 business days.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshStatus} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#1a1a2e" />
            ) : (
              <Text style={styles.refreshText}>Refresh Status</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {kycStatus === KycStatus.APPROVED && (
        <View style={[styles.infoBox, { backgroundColor: '#5cb85c20' }]}>
          <Text style={[styles.infoText, { color: '#5cb85c' }]}>
            Your identity has been verified! You now have access to all features including BNPL subscriptions and payments.
          </Text>
        </View>
      )}

      {kycStatus === KycStatus.REJECTED && (
        <View style={[styles.infoBox, { backgroundColor: '#d9534f20' }]}>
          <Text style={[styles.infoText, { color: '#d9534f' }]}>
            Your verification was rejected. Please submit clear, valid documents and try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => { setIdImage(null); setSelfieImage(null); setKycStatus(KycStatus.NONE); }}
          >
            <Text style={styles.buttonText}>Retry Verification</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  statusBadge: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  statusText: { fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  uploadBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: 8,
  },
  uploadText: { color: '#999', fontSize: 14, textAlign: 'center' },
  preview: { width: '100%', height: 200, borderRadius: 8 },
  button: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoBox: { backgroundColor: '#f0ad4e20', borderRadius: 12, padding: 20, marginTop: 16 },
  infoText: { fontSize: 14, lineHeight: 22, color: '#666', textAlign: 'center' },
  refreshButton: { alignItems: 'center', marginTop: 16 },
  refreshText: { color: '#1a1a2e', fontSize: 14, fontWeight: '600' },
});