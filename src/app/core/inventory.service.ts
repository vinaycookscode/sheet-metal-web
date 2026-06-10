import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface StockLot {
  id: string; itemId: string; lotNo?: string; location?: string; qtyOnHand: number; qtyAllocated: number; unitCost?: number; isRemnant: boolean; qcStatus?: string;
}
export interface StockTxnRow {
  id: string; txn_type: string; qty_delta: string; stock_lot_id: string; item_id: string; work_order_id: string | null; reference: string | null; at: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/stock`;

  list(itemId?: string) {
    const q = itemId ? `?itemId=${itemId}` : '';
    return this.http.get<StockLot[]>(`${this.base}${q}`);
  }
  ledger(itemId?: string) {
    const q = itemId ? `?itemId=${itemId}` : '';
    return this.http.get<StockTxnRow[]>(`${this.base}/ledger${q}`);
  }
  finishedGoods() {
    return this.http.get<Array<{ id: string; partNo: string; rev: string; salesOrder: string | null; qty: number; qtyShipped: number; available: number; location: string | null; createdAt: string }>>(`${this.base}/finished-goods`);
  }
  issue(workOrderId: string) {
    return this.http.post<Array<{ stockLotId: string; itemId: string; qty: number }>>(`${this.base}/issue`, { workOrderId });
  }
  adjust(body: { stockLotId: string; qtyDelta: number; reason: string }) {
    return this.http.post<StockLot>(`${this.base}/adjust`, body);
  }
  returnRemnant(body: { workOrderId: string; itemId: string; qty: number; location?: string }) {
    return this.http.post<StockLot>(`${this.base}/return-remnant`, body);
  }
  lotQc(lotId: string, decision: 'accepted' | 'rejected' | 'hold', note?: string) {
    return this.http.post<StockLot>(`${this.base}/lots/${lotId}/qc`, { decision, note });
  }
}
