import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Item, Supplier } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  suppliers(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<Supplier[]>(`${this.api}/suppliers${q}`);
  }

  items(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<Item[]>(`${this.api}/items${q}`);
  }

  stockSummary() {
    return this.http.get<Array<{ itemId: string; code: string; name: string; onHand: number; allocated: number; available: number }>>(
      `${this.api}/stock/summary`,
    );
  }
}
