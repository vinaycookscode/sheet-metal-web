import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CreateInquiry, Inquiry } from './models';

@Injectable({ providedIn: 'root' })
export class InquiriesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/inquiries`;

  list(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<Inquiry[]>(`${this.base}${q}`);
  }
  get(id: string) {
    return this.http.get<Inquiry>(`${this.base}/${id}`);
  }
  create(dto: CreateInquiry) {
    return this.http.post<Inquiry>(this.base, dto);
  }
  sendToEstimation(id: string, estimatorId: string) {
    return this.http.post<Inquiry>(`${this.base}/${id}/send-to-estimation`, { estimatorId });
  }
  outcome(id: string, status: 'won' | 'lost', lostReason?: string) {
    return this.http.post<Inquiry>(`${this.base}/${id}/outcome`, { status, lostReason });
  }
}
