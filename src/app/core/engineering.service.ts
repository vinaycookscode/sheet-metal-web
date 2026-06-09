import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CreatePart, Part } from './models';

@Injectable({ providedIn: 'root' })
export class EngineeringService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/parts`;

  list(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<Part[]>(`${this.base}${q}`);
  }
  get(id: string) { return this.http.get<Part>(`${this.base}/${id}`); }
  create(dto: CreatePart) { return this.http.post<Part>(this.base, dto); }
  release(id: string, soLineId?: string) { return this.http.post<Part>(`${this.base}/${id}/release`, { soLineId }); }
  explode(id: string, qty = 1) {
    return this.http.get<{ partId: string; ref: string; qty: number; components: unknown[] }>(`${this.base}/${id}/explode?qty=${qty}`);
  }
}
