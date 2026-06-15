import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SalesOrder } from './models';
import { Address } from './finance.service';

export interface SoDocument {
  title: string;
  seller: { name: string; plant: string; gstin?: string; stateCode?: string; address?: Address };
  buyer: { name: string; gstin?: string; stateCode?: string; address?: Address };
  so: { number: string; date: string; status: string; customerPo?: string | null; vendorCode?: string | null; gstTreatment: string };
  lines: Array<{ lineNo: number; description: string; hsnSac: string; qty: number; unitPrice: number; taxableValue: number; gstRate: number; cgst: number; sgst: number; igst: number; amount: number }>;
  totals: { subtotal: number; cgst: number; sgst: number; igst: number; taxTotal: number; grandTotal: number };
  amountInWords: string;
}

@Injectable({ providedIn: 'root' })
export class SalesOrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sales-orders`;

  document(id: string) { return this.http.get<SoDocument>(`${this.base}/${id}/document`); }

  list(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<SalesOrder[]>(`${this.base}${q}`);
  }
  get(id: string) {
    return this.http.get<SalesOrder>(`${this.base}/${id}`);
  }
  fromQuote(quoteVersionId: string, body: { customerPoNumber?: string; vendorCode?: string } = {}) {
    return this.http.post<SalesOrder>(`${this.base}/from-quote/${quoteVersionId}`, body);
  }
  update(id: string, body: { customerPoNumber?: string; vendorCode?: string; taxCodeId?: string; orderDate?: string }) {
    return this.http.patch<SalesOrder>(`${this.base}/${id}`, body);
  }
  setStatus(id: string, status: string) {
    return this.http.post<SalesOrder>(`${this.base}/${id}/status`, { status });
  }
}
