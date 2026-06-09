import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Inspection, Ncr } from './models';

@Injectable({ providedIn: 'root' })
export class QualityService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  inspections(kind?: string) {
    const q = kind ? `?kind=${kind}` : '';
    return this.http.get<Inspection[]>(`${this.api}/inspections${q}`);
  }
  inspection(id: string) { return this.http.get<Inspection>(`${this.api}/inspections/${id}`); }
  createInspection(body: { kind: string; soLineId?: string; characteristics: Array<{ characteristic: string; nominal?: number; tolerancePlus?: number; toleranceMinus?: number }> }) {
    return this.http.post<Inspection>(`${this.api}/inspections`, body);
  }
  record(id: string, results: Array<{ charId: string; measured?: number; result?: 'pass' | 'fail' }>) {
    return this.http.post<Inspection>(`${this.api}/inspections/${id}/record`, { results });
  }

  ncrs(filter?: { status?: string; critical?: boolean }) {
    const p = new URLSearchParams();
    if (filter?.status) p.set('status', filter.status);
    if (filter?.critical !== undefined) p.set('critical', String(filter.critical));
    const q = p.toString() ? `?${p}` : '';
    return this.http.get<Ncr[]>(`${this.api}/ncrs${q}`);
  }
  createNcr(body: { source: string; defect: string; isCritical?: boolean; supplierId?: string; workOrderId?: string; costOfQuality?: number }) {
    return this.http.post<Ncr>(`${this.api}/ncrs`, body);
  }
  disposition(id: string, body: { disposition: string; costOfQuality?: number }) {
    return this.http.post<Ncr>(`${this.api}/ncrs/${id}/disposition`, body);
  }
  closeNcr(id: string) { return this.http.post<Ncr>(`${this.api}/ncrs/${id}/close`, {}); }
}
