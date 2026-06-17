import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface BoardOp {
  id: string; op_no: number; op_status: string; work_center: string;
  wo_number: string; wo_status: string; due_date: string | null; part_no: string; behind_schedule: boolean;
}
export interface BoardGroup { workCenter: string; operations: BoardOp[]; }

export interface DowntimeEvent {
  id: string; workCenterId: string; reason: string; notes?: string; startedAt: string; endedAt?: string;
}
export const DOWNTIME_REASONS = [
  { value: 'setup', label: 'Setup' }, { value: 'changeover', label: 'Changeover' },
  { value: 'breakdown', label: 'Breakdown' }, { value: 'maintenance', label: 'Maintenance' },
  { value: 'no_material', label: 'No material' }, { value: 'no_operator', label: 'No operator' },
  { value: 'tooling', label: 'Tooling' }, { value: 'quality_hold', label: 'Quality hold' },
  { value: 'power', label: 'Power' }, { value: 'other', label: 'Other' },
];

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  board(workCenterId?: string) {
    const q = workCenterId ? `?workCenterId=${workCenterId}` : '';
    return this.http.get<BoardGroup[]>(`${this.api}/production/board${q}`);
  }
  traveler(woId: string) {
    return this.http.get<{ workOrder: any; barcode: string; operations: any[]; materials: any[] }>(`${this.api}/work-orders/${woId}/traveler`);
  }
  clockOn(woOperationId: string) {
    return this.http.post<{ laborEntryId: string; woOperationId: string; clockedOn: boolean }>(`${this.api}/production/clock-on`, { woOperationId });
  }
  clockOff(body: { woOperationId: string; qtyGood: number; qtyScrap?: number; scrapReason?: string }) {
    return this.http.post<{ opCompleted: boolean; woCompleted: boolean }>(`${this.api}/production/clock-off`, body);
  }

  openDowntime(workCenterId?: string) {
    const q = workCenterId ? `?workCenterId=${workCenterId}` : '';
    return this.http.get<DowntimeEvent[]>(`${this.api}/production/downtime${q}`);
  }
  startDowntime(body: { workCenterId: string; reason: string; woOperationId?: string; notes?: string }) {
    return this.http.post<DowntimeEvent>(`${this.api}/production/downtime/start`, body);
  }
  endDowntime(id: string) {
    return this.http.post<DowntimeEvent>(`${this.api}/production/downtime/${id}/end`, {});
  }
}
