import { useEffect, useRef } from 'react'
import { refreshAccessToken } from '../api/client'

export interface TicketStreamEvent {
  ticketId: string
  type: 'message' | 'status'
  message?: any
  status?: string
  createdAt: string
}

function getToken(): string {
  return localStorage.getItem('access_token') ?? ''
}

/**
 * Opens a Server-Sent Events connection to a ticket stream. EventSource
 * cannot set Authorization headers, so the JWT is passed as a query param
 * (the backend SseAuthGuard accepts either). Reconnects with a freshly
 * refreshed token when the connection drops (the access token expires every
 * 15m, which would otherwise kill real-time updates). Auto-closes on unmount
 * or when streamPath becomes null.
 */
export function useTicketStream(
  streamPath: string | null,
  onEvent: (event: TicketStreamEvent) => void,
) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!streamPath) return

    let es: EventSource | null = null
    let disposed = false
    let reconnectTimer: number | null = null

    const open = (token: string) => {
      if (disposed) return
      es = new EventSource(`/api/v1/${streamPath}?token=${encodeURIComponent(token)}`)

      es.onmessage = (msg) => {
        try {
          handlerRef.current(JSON.parse(msg.data))
        } catch {
          /* ignore malformed frames */
        }
      }

      es.onerror = () => {
        es?.close()
        es = null
        if (disposed) return
        if (reconnectTimer) window.clearTimeout(reconnectTimer)
        reconnectTimer = window.setTimeout(async () => {
          if (disposed) return
          const token = (await refreshAccessToken()) ?? getToken()
          if (!token) return
          open(token)
        }, 3000)
      }
    }

    open(getToken())

    return () => {
      disposed = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [streamPath])
}