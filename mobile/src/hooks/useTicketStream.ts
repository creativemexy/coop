import { useEffect, useRef } from 'react';
import SSE from 'react-native-sse';
import { API_BASE_URL } from '../constants';
import { getStoredTokens, refreshAccessToken } from '../api/client';

export interface TicketStreamEvent {
  ticketId: string;
  type: 'message' | 'status';
  message?: any;
  status?: string;
  createdAt: string;
}

/**
 * Opens a live SSE connection to the given ticket stream and invokes
 * `onEvent` for each server event. Reconnects with a freshly refreshed
 * token when the connection drops (the access token expires every 15m,
 * which would otherwise kill real-time updates). Auto-closes when the
 * component unmounts or `streamUrl` becomes null.
 */
export function useTicketStream(
  streamUrl: string | null,
  onEvent: (event: TicketStreamEvent) => void,
) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!streamUrl) return;

    let disposed = false;
    let es: SSE | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const open = (token: string) => {
      if (disposed) return;

      es = new SSE(`${API_BASE_URL}/${streamUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
        // In react-native-sse this doubles as the reconnect interval; a
        // positive value keeps the stream live after transient dropouts.
        pollingInterval: 3000,
      });

      es.addEventListener('message', (e: any) => {
        try {
          handlerRef.current(JSON.parse(e.data ?? ''));
        } catch {
          /* ignore malformed frames */
        }
      });

      const onDown = () => {
        es?.removeAllEventListeners();
        es?.close();
        es = null;
        if (disposed) return;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(async () => {
          if (disposed) return;
          const token = (await refreshAccessToken()) ?? (await getStoredTokens())?.accessToken;
          if (!token) return;
          open(token);
        }, 3000);
      };

      es.addEventListener('error', onDown);
      es.addEventListener('close', onDown);
    };

    void (async () => {
      const tokens = await getStoredTokens();
      if (disposed || !tokens) return;
      open(tokens.accessToken);
    })();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [streamUrl]);
}