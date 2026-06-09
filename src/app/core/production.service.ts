import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface BoardOp {
  id: string; op_no: number; op_status: string; work_center: string;
  wo_number: string; wo_status: string; due_date: string | null; part_no: string; behind_schedule: boolean;
}
export interface BoardGroup { workCenter: string; operations: BoardOp[]; }

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
}
