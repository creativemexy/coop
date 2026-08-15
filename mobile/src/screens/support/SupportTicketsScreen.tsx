import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { SupportTicket } from '../../types';

export default function SupportTicketsScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const { data } = await client.get(ENDPOINTS.dashboard.tickets);
        setTickets(data);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []));

  const handleCreate = async () => {
    if (!subject) { Alert.alert('Error', 'Subject is required'); return; }
    setSubmitting(true);
    try {
      await client.post(ENDPOINTS.dashboard.tickets, { subject, description });
      Alert.alert('Success', 'Ticket created');
      setShowNew(false); setSubject(''); setDescription('');
      const { data } = await client.get(ENDPOINTS.dashboard.tickets);
      setTickets(data);
    } catch (e: any) { Alert.alert('Error', getErrorMessage(e, 'Failed')); }
    finally { setSubmitting(false); }
  };

  const statusColors: Record<string, string> = { open: '#eab308', in_progress: '#2563eb', resolved: '#22c55e', closed: '#9ca3af' };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}>
      <TouchableOpacity style={styles.newBtn} onPress={() => setShowNew(true)}>
        <Text style={styles.newBtnText}>+ New Ticket</Text>
      </TouchableOpacity>

      {tickets.map((t) => (
        <View key={t.id} style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketSubject} numberOfLines={1}>{t.subject}</Text>
            <Text style={[styles.ticketStatus, { color: statusColors[t.status] || '#666' }]}>{t.status}</Text>
          </View>
          {t.description ? <Text style={styles.ticketDesc} numberOfLines={2}>{t.description}</Text> : null}
          <Text style={styles.ticketDate}>{new Date(t.createdAt).toLocaleDateString('en-NG')}</Text>
          {t.resolutionNote && <Text style={styles.resolution}>Resolution: {t.resolutionNote}</Text>}
        </View>
      ))}

      <Modal visible={showNew} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Ticket</Text>
            <TextInput style={styles.input} placeholder="Subject" placeholderTextColor="#999" value={subject} onChangeText={setSubject} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Description (optional)" placeholderTextColor="#999" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNew(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  newBtn: { backgroundColor: '#1a1a2e', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  newBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ticketCard: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 1 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ticketSubject: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  ticketStatus: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  ticketDesc: { fontSize: 13, color: '#666', marginBottom: 4 },
  ticketDate: { fontSize: 12, color: '#999' },
  resolution: { fontSize: 12, color: '#22c55e', marginTop: 4, fontStyle: 'italic' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
});
