import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Quote, QuoteDocument, QuoteFollowup, RecordQuoteResponse, ReviseQuote, SendQuoteEmail, SendQuoteEmailResult } from './models';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/quotes`;

  /** Read model for the printable/preview quote document. */
  document(id: string) {
    return this.http.get<QuoteDocument>(`${this.base}/${id}/document`);
  }

  /** Email the quote (PDF attached) to the customer. */
  sendEmail(id: string, dto: SendQuoteEmail) {
    return this.http.post<SendQuoteEmailResult>(`${this.base}/${id}/send-email`, dto);
  }

  /** Negotiation timeline (sends, responses, revisions, notes). */
  timeline(id: string) {
    return this.http.get<QuoteFollowup[]>(`${this.base}/${id}/timeline`);
  }

  /** Record a customer response internally (phone/email reply). */
  respond(id: string, dto: RecordQuoteResponse) {
    return this.http.post<{ status: string; nextFollowUpDate?: string | null }>(`${this.base}/${id}/respond`, dto);
  }

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
  /** Create a new version (e.g. after the customer bargains) — sets the quote back to draft. */
  revise(id: string, dto: ReviseQuote) {
    return this.http.post<Quote>(`${this.base}/${id}/revise`, dto);
  }
  setStatus(id: string, status: 'sent' | 'accepted' | 'rejected' | 'expired', winLossReason?: string) {
    return this.http.post<Quote>(`${this.base}/${id}/status`, { status, winLossReason });
  }
}
