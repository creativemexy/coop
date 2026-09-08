import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, ScrollView, RefreshControl, TextInput, StyleSheet, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import client, { getErrorMessage } from '../../api/client';
import { ENDPOINTS } from '../../constants';
import { useTicketStream } from '../../hooks/useTicketStream';
import type { TicketStreamEvent } from '../../hooks/useTicketStream';
import { SupportTicket } from '../../types';
import { useAccessibility } from '../../ui/a11y';
import { AppPressable, AppText, ScreenReaderAnnounce } from '../../ui/primitives';
import { LoadingView } from '../../ui/Loading';
import { Toast, ToastData } from '../../ui/Toast';
import { MessageBubble, TypingIndicator, BubbleSender } from '../../ui/communication';
import { layout, spacing, type } from '../../ui/theme';

interface TicketMessage {
  id: string;
  senderRole: string;
  senderName?: string;
  message: string;
  createdAt: string;
}

type OpenTicket = SupportTicket & { canReply?: boolean };

export default function SupportTicketsScreen() {
  const [tickets, setTickets] = useState<OpenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selTicket, setSelTicket] = useState<OpenTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [toast, setToast] = useState<ToastData | null>(null);
  const [announce, setAnnounce] = useState<string | null>(null);
  const toastId = useRef(0);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, kind: ToastData['kind']) => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, kind });
    setAnnounce(message);
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnounce(null), 4000);
  }, []);

  const { palette, scale, reduceMotion } = useAccessibility();
  const isIOS = Platform.OS === 'ios';
  const isDark = palette.background === '#0B1220';

  const load = useCallback(async () => {
    try {
      const { data } = await client.get(ENDPOINTS.dashboard.tickets);
      setTickets(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useTicketStream(
    ENDPOINTS.dashboard.ticketListStream,
    useCallback(() => { load(); }, [load]),
  );

  const refreshMessages = useCallback(async (ticketId: string) => {
    try {
      const { data } = await client.get(ENDPOINTS.dashboard.ticketMessages(ticketId));
      setMessages(data);
    } catch { /* keep last known */ }
  }, []);

  useTicketStream(
    selTicket ? ENDPOINTS.dashboard.ticketStream(selTicket.id) : null,
    useCallback((ev: TicketStreamEvent) => {
      if (!selTicket) return;
      if (ev.type === 'status') {
        setTickets((prev) =>
          prev.map((t) => (t.id === selTicket.id ? { ...t, status: ev.status || t.status } : t)),
        );
        setSelTicket((prev) => (prev ? { ...prev, status: ev.status || prev.status } : prev));
        return;
      }
      void refreshMessages(selTicket.id);
    }, [selTicket, refreshMessages]),
  );

  const openTicket = useCallback(async (t: OpenTicket) => {
    setSelTicket(t);
    setReplyText('');
    setLoadingMessages(true);
    try {
      const { data } = await client.get(ENDPOINTS.dashboard.ticketMessages(t.id));
      setMessages(data);
    } catch { setMessages([]); }
    setLoadingMessages(false);
  }, []);

  const handleReply = async () => {
    if (!replyText.trim() || !selTicket) return;
    setSendingReply(true);
    try {
      await client.post(ENDPOINTS.dashboard.ticketMessages(selTicket.id), { message: replyText });
      setReplyText('');
      const { data } = await client.get(ENDPOINTS.dashboard.ticketMessages(selTicket.id));
      setMessages(data);
      load();
      showToast('Reply sent', 'success');
    } catch (e: any) {
      showToast(getErrorMessage(e, 'Failed to send reply'), 'error');
    }
    setSendingReply(false);
  };

  const handleCreate = async () => {
    if (!subject) { showToast('Subject is required', 'error'); return; }
    setSubmitting(true);
    try {
      await client.post(ENDPOINTS.dashboard.tickets, { subject, description });
      showToast('Ticket created', 'success');
      setShowNew(false); setSubject(''); setDescription('');
      await load();
    } catch (e: any) {
      showToast(getErrorMessage(e, 'Failed to create ticket'), 'error');
    } finally { setSubmitting(false); }
  };

  const statusColors: Record<string, { bg: string; fg: string }> = {
    open: { bg: isDark ? '#FACC1522' : '#FACC1522', fg: '#FACC15' },
    in_progress: { bg: '#38BDF822', fg: '#38BDF8' },
    resolved: { bg: '#4ADE8022', fg: '#4ADE80' },
    closed: { bg: '#94A3B822', fg: '#94A3B8' },
  };

  const statusLabel = (s: string) => s.replace(/_/g, ' ');

  const canReply = selTicket?.canReply ?? (selTicket?.status === 'open' || selTicket?.status === 'in_progress');

  const renderTicket = (t: OpenTicket) => {
    const sc = statusColors[t.status] || statusColors.open;
    const cardStyle = isIOS ? styles.cardGlass : [styles.cardM3, isDark && styles.cardM3Dark];
    const subjectColor = isIOS ? '#fff' : isDark ? '#fff' : '#173F38';
    const descColor = isIOS ? 'rgba(255,255,255,0.6)' : isDark ? 'rgba(255,255,255,0.7)' : '#627084';
    return (
      <AppPressable
        key={t.id}
        accessibilityRole="button"
        accessibilityLabel={`Ticket ${t.subject}, status ${statusLabel(t.status)}`}
        accessibilityHint={`Opens conversation with ${t.senderName || 'support'}`}
        style={[styles.card, cardStyle]}
        onPress={() => openTicket(t)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
            <AppText style={[styles.statusText, { color: sc.fg, fontSize: scale(type.caption) }]}>{statusLabel(t.status)}</AppText>
          </View>
          <AppText style={[styles.cardDate, { color: isIOS ? 'rgba(255,255,255,0.55)' : isDark ? 'rgba(255,255,255,0.5)' : '#94A3B8', fontSize: scale(type.caption) }]}>
            {new Date(t.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
          </AppText>
        </View>
        <AppText style={[styles.cardSubject, { color: subjectColor, fontSize: scale(type.body) }]} numberOfLines={2}>{t.subject}</AppText>
        {t.description ? (
          <AppText style={[styles.cardDesc, { color: descColor, fontSize: scale(type.small) }]} numberOfLines={2}>{t.description}</AppText>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={[styles.identity, isIOS && styles.identityGlass, isDark && !isIOS && styles.identityDark]}>
            <Ionicons name="person-circle-outline" size={15} color={isIOS ? '#8FD8C0' : isDark ? '#8FD8C0' : '#0F766E'} />
            <AppText style={[styles.identityText, { color: isIOS ? '#8FD8C0' : isDark ? '#8FD8C0' : '#0F766E', fontSize: scale(type.caption) }]}>{t.senderName || 'You'}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isIOS ? 'rgba(255,255,255,0.5)' : isDark ? 'rgba(255,255,255,0.5)' : '#627084'} />
        </View>
      </AppPressable>
    );
  };

  return (
    <LinearGradient
      colors={isIOS ? ['#0A1F1C', '#123A34', '#173F38'] : isDark ? ['#071310', '#0B1F1A', '#0E2A23'] : ['#0E342C', '#173F38', '#1D4A3F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={[styles.blob, styles.blobGold, { top: -80, right: -60 }]} />
      <View style={[styles.blob, styles.blobTeal, { top: '45%', left: -70 }]} />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={isIOS ? '#fff' : '#0F766E'} />}
        >
          <AppText accessibilityRole="header" style={[styles.heading, { fontSize: scale(type.heading) }]}>Support Tickets</AppText>
          <AppText style={[styles.subheading, { color: isIOS ? 'rgba(255,255,255,0.6)' : '#94A3B8', fontSize: scale(type.small) }]}>
            Track your conversations and reply while a ticket is open.
          </AppText>

          <AppPressable
            accessibilityRole="button"
            accessibilityLabel="New ticket"
            style={[styles.newBtn, isIOS && styles.newBtnGlass]}
            onPress={() => setShowNew(true)}
          >
            <Ionicons name="add" size={20} color={isIOS ? '#173F38' : '#fff'} />
            <AppText style={[styles.newBtnText, { color: isIOS ? '#173F38' : '#fff', fontSize: scale(type.body) }]}>New Ticket</AppText>
          </AppPressable>

          {loading ? (
            <LoadingView label="Loading tickets…" light={isIOS || isDark} />
          ) : tickets.length === 0 ? (
            <View style={[styles.empty, isIOS && styles.cardGlass, isDark && !isIOS && styles.cardM3Dark]}>
              <Ionicons name="chatbubbles-outline" size={34} color={isIOS ? 'rgba(255,255,255,0.5)' : '#94A3B8'} />
              <AppText style={[styles.emptyTitle, { color: isIOS ? '#fff' : isDark ? '#fff' : '#173F38', fontSize: scale(type.body) }]}>No tickets yet</AppText>
              <AppText style={[styles.emptyDesc, { color: isIOS ? 'rgba(255,255,255,0.6)' : '#627084', fontSize: scale(type.small) }]}>Create a ticket and our team will respond here.</AppText>
            </View>
          ) : (
            tickets.map(renderTicket)
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Conversation modal */}
      <Modal visible={!!selTicket} transparent animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setSelTicket(null)}>
        <View style={styles.modalOverlay}>
          {isIOS ? (
            <BlurView intensity={60} tint="dark" style={styles.modalGlass}>
              <ModalBody
                ticket={selTicket!}
                messages={messages}
                loadingMessages={loadingMessages}
                replyText={replyText}
                setReplyText={setReplyText}
                sendingReply={sendingReply}
                canReply={canReply}
                onReply={handleReply}
                onClose={() => setSelTicket(null)}
                isIOS={isIOS}
                isDark={isDark}
                scale={scale}
              />
            </BlurView>
          ) : (
            <View style={[styles.modalM3, isDark && styles.modalM3Dark]}>
              <ModalBody
                ticket={selTicket!}
                messages={messages}
                loadingMessages={loadingMessages}
                replyText={replyText}
                setReplyText={setReplyText}
                sendingReply={sendingReply}
                canReply={canReply}
                onReply={handleReply}
                onClose={() => setSelTicket(null)}
                isIOS={isIOS}
                isDark={isDark}
                scale={scale}
              />
            </View>
          )}
        </View>
      </Modal>

      {/* New ticket modal */}
      <Modal visible={showNew} transparent animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setShowNew(false)}>
        <View style={styles.modalOverlay}>
          {isIOS ? (
            <BlurView intensity={60} tint="dark" style={styles.modalGlass}>
              <NewTicketForm subject={subject} setSubject={setSubject} description={description} setDescription={setDescription} submitting={submitting} onSubmit={handleCreate} onCancel={() => setShowNew(false)} isIOS={isIOS} isDark={isDark} scale={scale} />
            </BlurView>
          ) : (
            <View style={[styles.modalM3, isDark && styles.modalM3Dark]}>
              <NewTicketForm subject={subject} setSubject={setSubject} description={description} setDescription={setDescription} submitting={submitting} onSubmit={handleCreate} onCancel={() => setShowNew(false)} isIOS={isIOS} isDark={isDark} scale={scale} />
            </View>
          )}
        </View>
      </Modal>

      <Toast toast={toast} />
      <ScreenReaderAnnounce message={announce} />
    </LinearGradient>
  );
}

function ModalBody({
  ticket, messages, loadingMessages, replyText, setReplyText, sendingReply, canReply, onReply, onClose, isIOS, isDark, scale,
}: {
  ticket: OpenTicket;
  messages: TicketMessage[];
  loadingMessages: boolean;
  replyText: string;
  setReplyText: (t: string) => void;
  sendingReply: boolean;
  canReply: boolean;
  onReply: () => void;
  onClose: () => void;
  isIOS: boolean;
  isDark: boolean;
  scale: (n: number) => number;
}) {
  const statusColors: Record<string, { bg: string; fg: string }> = {
    open: { bg: '#FACC1522', fg: '#FACC15' },
    in_progress: { bg: '#38BDF822', fg: '#38BDF8' },
    resolved: { bg: '#4ADE8022', fg: '#4ADE80' },
    closed: { bg: '#94A3B822', fg: '#94A3B8' },
  };
  const sc = statusColors[ticket.status] || statusColors.open;
  const titleColor = isIOS ? '#fff' : isDark ? '#fff' : '#173F38';
  const mutedColor = isIOS ? 'rgba(255,255,255,0.55)' : isDark ? 'rgba(255,255,255,0.55)' : '#627084';

  return (
    <View style={styles.modalInner}>
      <View style={styles.modalHeader}>
        <AppPressable accessibilityRole="button" accessibilityLabel="Close conversation" onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={26} color={isIOS ? 'rgba(255,255,255,0.7)' : '#627084'} />
        </AppPressable>
        <View style={styles.modalHeaderCopy}>
          <AppText style={[styles.modalTitle, { color: titleColor, fontSize: scale(type.title) }]} numberOfLines={1}>{ticket.subject}</AppText>
          <View style={styles.modalHeaderMeta}>
            <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
              <AppText style={[styles.statusText, { color: sc.fg, fontSize: scale(type.caption) }]}>{ticket.status.replace(/_/g, ' ')}</AppText>
            </View>
            {ticket.senderName && (
              <AppText style={[styles.senderHint, { color: mutedColor, fontSize: scale(type.caption) }]}>
                from {ticket.senderName}{ticket.senderEmail ? ` · ${ticket.senderEmail}` : ''}
              </AppText>
            )}
          </View>
        </View>
      </View>

      {ticket.description ? (
        <View style={[styles.descriptionBox, isIOS && styles.descriptionBoxGlass, isDark && !isIOS && styles.descriptionBoxDark]}>
          <AppText style={[styles.descriptionText, { color: isIOS ? '#fff' : isDark ? '#fff' : '#173F38', fontSize: scale(type.small) }]}>{ticket.description}</AppText>
        </View>
      ) : null}

      <ScrollView style={styles.thread} contentContainerStyle={styles.threadContent}>
        {loadingMessages ? (
          <LoadingView label="Loading conversation…" light={isIOS || isDark} />
        ) : messages.length === 0 ? (
          <AppText style={[styles.threadHint, { color: mutedColor, fontSize: scale(type.small) }]}>No replies yet. Support will respond shortly.</AppText>
        ) : (
          messages.map((m, idx) => {
            const sender: BubbleSender = m.senderRole === 'individual' ? 'mine' : 'theirs';
            const meta = `${m.senderName || (sender === 'mine' ? 'You' : 'Support')} · ${new Date(m.createdAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
            return (
              <MessageBubble
                key={m.id}
                message={m.message}
                sender={sender}
                meta={meta}
                isDark={isIOS || isDark}
                animateIn={idx === messages.length - 1}
              />
            );
          })
        )}
        {sendingReply ? <TypingIndicator isDark={isIOS || isDark} /> : null}
      </ScrollView>

      {canReply ? (
        <View style={styles.replyBar}>
          <TextInput
            style={[styles.replyInput, { fontSize: scale(type.body) }, isIOS ? styles.replyInputIOS : [styles.replyInputM3, isDark && styles.inputDark]]}
            placeholder="Type a reply…"
            placeholderTextColor={isIOS ? 'rgba(255,255,255,0.4)' : '#94A3B8'}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            accessibilityLabel="Reply to ticket"
            accessibilityHint="Type your message, then tap send"
          />
          <AppPressable accessibilityRole="button" accessibilityLabel="Send reply" style={[styles.sendBtn, isIOS && styles.sendBtnGlass]} onPress={onReply} disabled={sendingReply || !replyText.trim()}>
            <Ionicons name="send" size={20} color={isIOS ? '#173F38' : '#fff'} />
          </AppPressable>
        </View>
      ) : (
        <View style={[styles.closedBanner, isIOS && styles.descriptionBoxGlass, isDark && !isIOS && styles.descriptionBoxDark]}>
          <Ionicons name="lock-closed-outline" size={15} color={mutedColor} />
          <AppText style={[styles.closedText, { color: mutedColor, fontSize: scale(type.small) }]}>This ticket is {ticket.status} and is read-only.</AppText>
        </View>
      )}
    </View>
  );
}

function NewTicketForm({
  subject, setSubject, description, setDescription, submitting, onSubmit, onCancel, isIOS, isDark, scale,
}: {
  subject: string;
  setSubject: (t: string) => void;
  description: string;
  setDescription: (t: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  isIOS: boolean;
  isDark: boolean;
  scale: (n: number) => number;
}) {
  const titleColor = isIOS ? '#fff' : isDark ? '#fff' : '#173F38';
  const inputStyle = isIOS ? [styles.input, styles.inputIOS] : [styles.input, styles.inputM3, isDark && styles.inputDark];
  return (
    <View style={styles.modalInner}>
      <AppText accessibilityRole="header" style={[styles.modalTitle, { color: titleColor, fontSize: scale(type.title) }]}>New Ticket</AppText>
      <TextInput
        style={inputStyle}
        placeholder="Subject"
        placeholderTextColor={isIOS ? 'rgba(255,255,255,0.4)' : '#94A3B8'}
        value={subject}
        onChangeText={setSubject}
        accessibilityLabel="Subject"
        accessibilityHint="Short title for your request"
      />
      <TextInput
        style={[styles.textArea, inputStyle]}
        placeholder="Description (optional)"
        placeholderTextColor={isIOS ? 'rgba(255,255,255,0.4)' : '#94A3B8'}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        accessibilityLabel="Description"
        accessibilityHint="Optional details about your request"
      />
      <View style={styles.modalActions}>
        <AppPressable style={[styles.cancelButton, isIOS && styles.cancelButtonGlass]} onPress={onCancel} accessibilityRole="button">
          <AppText style={[styles.cancelText, { color: isIOS ? '#fff' : isDark ? '#fff' : '#173F38', fontSize: scale(type.body) }]}>Cancel</AppText>
        </AppPressable>
        <AppPressable style={[styles.submitButton, isIOS && styles.submitButtonGlass]} onPress={onSubmit} disabled={submitting || !subject} accessibilityRole="button">
          {submitting ? (
            <LoadingView label="Submitting…" light={isIOS || isDark} />
          ) : (
            <AppText style={[styles.submitText, { color: isIOS ? '#173F38' : '#fff', fontSize: scale(type.body) }]}>Submit</AppText>
          )}
        </AppPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  blob: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },
  blobGold: { backgroundColor: 'rgba(228,164,42,0.16)' },
  blobTeal: { backgroundColor: 'rgba(56,180,150,0.14)' },
  content: { padding: spacing.xl, paddingBottom: 40 },
  heading: { color: '#fff', fontWeight: '800', letterSpacing: -0.5 },
  subheading: { marginTop: 4, marginBottom: 18, fontWeight: '500' },
  newBtn: {
    alignItems: 'center', backgroundColor: '#173F38', borderRadius: 16, flexDirection: 'row', gap: 8,
    justifyContent: 'center', marginBottom: spacing.lg, minHeight: layout.touchTarget,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  newBtnGlass: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  newBtnText: { fontWeight: '700' },
  card: { borderRadius: 18, marginBottom: spacing.md, padding: spacing.lg, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardGlass: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  cardM3: { backgroundColor: '#F6F3EB' },
  cardM3Dark: { backgroundColor: '#131C2E', borderWidth: 1, borderColor: '#26354C' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontWeight: '700', textTransform: 'capitalize' },
  cardDate: { fontWeight: '600' },
  cardSubject: { fontWeight: '700' },
  cardDesc: { marginTop: spacing.xs },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  identityGlass: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  identityDark: { backgroundColor: 'rgba(255,255,255,0.08)' },
  identityText: { fontWeight: '600' },
  empty: { alignItems: 'center', borderRadius: 18, padding: 28 },
  emptyTitle: { fontWeight: '700', marginTop: 10 },
  emptyDesc: { marginTop: 4, textAlign: 'center' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 20, 35, 0.55)' },
  modalGlass: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: 34, maxHeight: '92%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden',
  },
  modalM3: { backgroundColor: '#F6F3EB', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, maxHeight: '92%', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 12 },
  modalM3Dark: { backgroundColor: '#131C2E', borderWidth: 1, borderColor: '#26354C' },
  modalInner: { maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  closeBtn: { width: layout.touchTarget, alignItems: 'center', justifyContent: 'center', minHeight: layout.touchTarget },
  modalHeaderCopy: { flex: 1 },
  modalTitle: { fontWeight: '800' },
  modalHeaderMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  senderHint: { fontWeight: '600' },
  descriptionBox: { borderRadius: 14, padding: spacing.md, marginBottom: spacing.md },
  descriptionBoxGlass: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  descriptionBoxDark: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: '#26354C' },
  descriptionText: { lineHeight: 20 },
  thread: { flexGrow: 0, maxHeight: '45%', marginBottom: spacing.md },
  threadContent: { gap: spacing.md, paddingVertical: 4 },
  threadHint: { textAlign: 'center', paddingVertical: spacing.md },

  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  replyInput: { borderRadius: 16, borderWidth: 1, flex: 1, maxHeight: 100, paddingHorizontal: spacing.md, paddingVertical: 10 },
  replyInputIOS: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff' },
  replyInputM3: { backgroundColor: '#fff', borderColor: '#E2E8F0', color: '#173F38' },
  inputDark: { backgroundColor: '#0B1220', borderColor: '#26354C', color: '#fff' },
  sendBtn: { alignItems: 'center', backgroundColor: '#173F38', borderRadius: 18, height: layout.touchTarget, justifyContent: 'center', width: layout.touchTarget },
  sendBtnGlass: { backgroundColor: 'rgba(255,255,255,0.92)' },
  closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: spacing.md },
  closedText: { fontWeight: '600' },

  input: { borderRadius: 14, borderWidth: 1, fontSize: 16, marginBottom: spacing.md, minHeight: layout.touchTarget, paddingHorizontal: spacing.md },
  inputIOS: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff' },
  inputM3: { backgroundColor: '#fff', borderColor: '#E2E8F0', color: '#173F38' },
  textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.md },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  cancelButton: { alignItems: 'center', borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: layout.touchTarget },
  cancelButtonGlass: { backgroundColor: 'rgba(255,255,255,0.16)' },
  cancelText: { fontWeight: '700' },
  submitButton: { alignItems: 'center', backgroundColor: '#173F38', borderRadius: 14, flex: 1.4, justifyContent: 'center', minHeight: layout.touchTarget },
  submitButtonGlass: { backgroundColor: 'rgba(255,255,255,0.92)' },
  submitText: { fontWeight: '700' },
});