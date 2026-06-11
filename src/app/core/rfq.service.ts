import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface RfqRow { id: string; number: string; status: string; notes?: string; createdAt: string; lineCount: number; }
export interface RfqLine { id: string; itemId: string; itemCode: string; itemName: string; qty: number; }
export interface RfqQuote { id: string; rfqLineId: string; supplierId: string; supplier: string; unitPrice: number; leadDays: number | null; }
export interface RfqDetail { id: string; number: string; status: string; notes?: string; lines: RfqLine[]; quotes: RfqQuote[]; }
export interface RfqCompareLine extends RfqLine { quotes: Array<RfqQuote & { extended: number; best: boolean }>; }

@Injectable({ providedIn: 'root' })
export class RfqService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/rfqs`;

  list() { return this.http.get<RfqRow[]>(this.base); }
  create(body: { lines: Array<{ itemId: string; qty: number }>; notes?: string }) { return this.http.post<RfqRow>(this.base, body); }
  get(id: string) { return this.http.get<RfqDetail>(`${this.base}/${id}`); }
  compare(id: string) { return this.http.get<RfqCompareLine[]>(`${this.base}/${id}/compare`); }
  addQuote(id: string, body: { rfqLineId: string; supplierId: string; unitPrice: number; leadDays?: number }) {
    return this.http.post<RfqQuote>(`${this.base}/${id}/quotes`, body);
  }
  award(id: string, supplierId: string) { return this.http.post<{ id: string; number: string }>(`${this.base}/${id}/award`, { supplierId }); }
}
