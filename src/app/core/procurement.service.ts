import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Grn, PurchaseOrder } from './models';
import { Address } from './finance.service';

export interface PoDocument {
  title: string;
  buyer: { name: string; plant: string; gstin?: string; stateCode?: string; address?: Address };
  supplier: { name: string; code?: string; gstin?: string; stateCode?: string };
  po: { number: string; date: string; status: string; gstTreatment: string };
  lines: Array<{ lineNo: number; description: string; hsnSac: string; qty: number; unitPrice: number; taxableValue: number; gstRate: number; cgst: number; sgst: number; igst: number; amount: number }>;
  totals: { subtotal: number; cgst: number; sgst: number; igst: number; taxTotal: number; grandTotal: number };
  amountInWords: string;
}

@Injectable({ providedIn: 'root' })
export class ProcurementService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  pos(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<PurchaseOrder[]>(`${this.api}/purchase-orders${q}`);
  }
  po(id: string) { return this.http.get<PurchaseOrder>(`${this.api}/purchase-orders/${id}`); }
  document(id: string) { return this.http.get<PoDocument>(`${this.api}/purchase-orders/${id}/document`); }
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
