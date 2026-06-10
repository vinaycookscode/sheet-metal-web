import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notifications`;

  list(opts: { unreadOnly?: boolean; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (opts.unreadOnly) q.set('unread', 'true');
    if (opts.limit) q.set('limit', String(opts.limit));
    const qs = q.toString();
    return this.http.get<AppNotification[]>(`${this.base}${qs ? '?' + qs : ''}`);
  }
  unreadCount() {
    return this.http.get<{ count: number }>(`${this.base}/unread-count`);
  }
  markRead(id: string) {
    return this.http.post(`${this.base}/${id}/read`, {});
  }
  markAllRead() {
    return this.http.post(`${this.base}/read-all`, {});
  }
}
