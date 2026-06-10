import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EwayBill, Shipment } from './models';
import { Address } from './finance.service';

export interface ChallanDocument {
  title: string;
  seller: { name: string; plant: string; gstin?: string; stateCode?: string; address?: Address };
  buyer: { name: string; code?: string; gstin?: string; stateCode?: string; billingAddress?: Address; shippingAddress?: Address };
  challan: { number: string; date: string; status: string; salesOrder?: string | null; customerPo?: string | null };
  transport: { carrier?: string | null; trackingNo?: string | null; ewbNumber?: string | null; vehicleNo?: string | null };
  lines: Array<{ lineNo: number; description: string; qty: number; boxNo: string; weightKg: number | null }>;
  totals: { totalQty: number; totalWeightKg: number | null };
}

export interface CertificateDocument {
  title: string;
  number: string;
  date: string;
  seller: { name: string; plant: string; gstin?: string; stateCode?: string; address?: Address };
  buyer: { name: string; gstin?: string };
  refs: { shipment: string; salesOrder?: string | null; customerPo?: string | null };
  lines: Array<{ partName: string; qty: number }>;
  traceability: Array<{ item: string; heatNo?: string; lotNo?: string }>;
  inspections: Array<{ kind: string; result: string }>;
  declaration: string;
}

export interface QualityDossier {
  shipment: string;
  inspections: Array<{ id: string; kind: string; result: string; at: string | null }>;
  documents: Array<{ id: string; kind: string; fileName: string; entityType: string; version: number }>;
}

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
  document(id: string) { return this.http.get<ChallanDocument>(`${this.base}/${id}/document`); }
  certificate(id: string) { return this.http.get<CertificateDocument>(`${this.base}/${id}/certificate`); }
  dossier(id: string) { return this.http.get<QualityDossier>(`${this.base}/${id}/dossier`); }
  getEway(id: string) { return this.http.get<EwayBill>(`${this.base}/${id}/eway-bill`); }
  genEway(id: string, body: { value: number; distanceKm: number; vehicleNo: string }) {
    return this.http.post<EwayBill>(`${this.base}/${id}/eway-bill`, body);
  }
}
