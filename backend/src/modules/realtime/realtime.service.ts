import { Injectable } from '@nestjs/common';
import { Subject, Observable, interval, merge } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

export interface TicketEvent {
  ticketId: string;
  type: 'message' | 'status';
  message?: any;
  status?: string;
  senderId?: string;
  senderRole?: string;
  senderName?: string;
  createdBy?: string;
  createdAt: string;
}

@Injectable()
export class RealtimeService {
  private subjects = new Map<string, Subject<TicketEvent>>();
  private broadcast = new Subject<TicketEvent>();

  private subjectFor(ticketId: string): Subject<TicketEvent> {
    let sub = this.subjects.get(ticketId);
    if (!sub) {
      sub = new Subject<TicketEvent>();
      this.subjects.set(ticketId, sub);
    }
    return sub;
  }

  publish(ticketId: string, event: Omit<TicketEvent, 'ticketId' | 'createdAt'>) {
    const full = {
      ...event,
      ticketId,
      createdAt: new Date().toISOString(),
    } as TicketEvent;
    this.subjectFor(ticketId).next(full);
    this.broadcast.next(full);
  }

  stream(ticketId: string): Observable<MessageEvent> {
    const events = this.subjectFor(ticketId).pipe(
      filter((e) => e.ticketId === ticketId),
      map((e) => ({ data: JSON.stringify(e) }) as MessageEvent),
    );
    const heartbeat = interval(15000).pipe(
      map(() => ({ data: '' }) as MessageEvent),
    );
    return merge(events, heartbeat);
  }

  streamAll(): Observable<MessageEvent> {
    const events = this.broadcast.pipe(
      map((e) => ({ data: JSON.stringify(e) }) as MessageEvent),
    );
    const heartbeat = interval(15000).pipe(
      map(() => ({ data: '' }) as MessageEvent),
    );
    return merge(events, heartbeat);
  }

  streamForUser(userId: string): Observable<MessageEvent> {
    const events = this.broadcast.pipe(
      filter((e) => !e.createdBy || e.createdBy === userId),
      map((e) => ({ data: JSON.stringify(e) }) as MessageEvent),
    );
    const heartbeat = interval(15000).pipe(
      map(() => ({ data: '' }) as MessageEvent),
    );
    return merge(events, heartbeat);
  }
}
