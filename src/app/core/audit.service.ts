import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AuditEntry {
  id: string | number;
  entityType: string;
  entityId: string;
  action: string;
  after?: Record<string, unknown> | null;
  at: string;
  actorId?: string;
  actorName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/audit-logs`;

  list(opts: { entityType?: string; entityId?: string; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (opts.entityType) q.set('entityType', opts.entityType);
    if (opts.entityId) q.set('entityId', opts.entityId);
    if (opts.limit) q.set('limit', String(opts.limit));
    const qs = q.toString();
    return this.http.get<AuditEntry[]>(`${this.base}${qs ? '?' + qs : ''}`);
  }
}
