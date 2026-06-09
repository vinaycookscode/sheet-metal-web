import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Quote } from './models';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/quotes`;

  list(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<Quote[]>(`${this.base}${q}`);
  }
  get(id: string) {
    return this.http.get<Quote>(`${this.base}/${id}`);
  }
  createFromInquiry(inquiryId: string) {
    return this.http.post<Quote>(this.base, { inquiryId });
  }
  setStatus(id: string, status: 'sent' | 'accepted' | 'rejected' | 'expired', winLossReason?: string) {
    return this.http.post<Quote>(`${this.base}/${id}/status`, { status, winLossReason });
  }
}
