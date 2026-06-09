import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MrpResult, PurchaseRequisition, WorkOrder } from './models';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  runMrp() { return this.http.post<MrpResult>(`${this.api}/mrp/run`, {}); }
  workOrders(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<WorkOrder[]>(`${this.api}/work-orders${q}`);
  }
  workOrder(id: string) { return this.http.get<WorkOrder>(`${this.api}/work-orders/${id}`); }
  releaseWo(id: string) {
    return this.http.post<{ workOrder: WorkOrder; allocations: Array<{ itemId: string; allocated: number; shortfall: number }> }>(`${this.api}/work-orders/${id}/release`, {});
  }
  requisitions(ordered?: boolean) {
    const q = ordered === undefined ? '' : `?ordered=${ordered}`;
    return this.http.get<PurchaseRequisition[]>(`${this.api}/purchase-requisitions${q}`);
  }
}
