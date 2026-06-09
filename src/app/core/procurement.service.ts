import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Grn, PurchaseOrder } from './models';

@Injectable({ providedIn: 'root' })
export class ProcurementService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  pos(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<PurchaseOrder[]>(`${this.api}/purchase-orders${q}`);
  }
  po(id: string) { return this.http.get<PurchaseOrder>(`${this.api}/purchase-orders/${id}`); }
  fromRequisitions(supplierId: string, lines: Array<{ requisitionId: string; unitPrice: number; taxCodeId?: string }>) {
    return this.http.post<PurchaseOrder>(`${this.api}/purchase-orders/from-requisitions`, { supplierId, lines });
  }
  approve(id: string) { return this.http.post<PurchaseOrder>(`${this.api}/purchase-orders/${id}/approve`, {}); }
  send(id: string) { return this.http.post<PurchaseOrder>(`${this.api}/purchase-orders/${id}/send`, {}); }

  grns(purchaseOrderId?: string) {
    const q = purchaseOrderId ? `?purchaseOrderId=${purchaseOrderId}` : '';
    return this.http.get<Grn[]>(`${this.api}/grns${q}`);
  }
  createGrn(body: { purchaseOrderId: string; lines: Array<{ poLineId: string; qtyReceived: number; qtyRejected?: number; heatNo?: string; lotNo?: string }> }) {
    return this.http.post<Grn>(`${this.api}/grns`, body);
  }
}
