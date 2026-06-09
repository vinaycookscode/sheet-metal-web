import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EwayBill, Shipment } from './models';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/shipments`;

  list(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<Shipment[]>(`${this.base}${q}`);
  }
  get(id: string) { return this.http.get<Shipment>(`${this.base}/${id}`); }
  create(body: { salesOrderId: string; carrier?: string; lines: Array<{ soLineId: string; qty: number; boxNo?: string; weightKg?: number }> }) {
    return this.http.post<Shipment>(this.base, body);
  }
  pack(id: string) { return this.http.post<Shipment>(`${this.base}/${id}/pack`, {}); }
  dispatch(id: string, body: { carrier?: string; trackingNo?: string; freightCost?: number }) {
    return this.http.post<Shipment>(`${this.base}/${id}/dispatch`, body);
  }
  challan(id: string) { return this.http.get<any>(`${this.base}/${id}/challan`); }
  getEway(id: string) { return this.http.get<EwayBill>(`${this.base}/${id}/eway-bill`); }
  genEway(id: string, body: { value: number; distanceKm: number; vehicleNo: string }) {
    return this.http.post<EwayBill>(`${this.base}/${id}/eway-bill`, body);
  }
}
