import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SalesOrder } from './models';

@Injectable({ providedIn: 'root' })
export class SalesOrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sales-orders`;

  list(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<SalesOrder[]>(`${this.base}${q}`);
  }
  get(id: string) {
    return this.http.get<SalesOrder>(`${this.base}/${id}`);
  }
  fromQuote(quoteVersionId: string, customerPoNumber?: string) {
    return this.http.post<SalesOrder>(`${this.base}/from-quote/${quoteVersionId}`, { customerPoNumber });
  }
  setStatus(id: string, status: string) {
    return this.http.post<SalesOrder>(`${this.base}/${id}/status`, { status });
  }
}
