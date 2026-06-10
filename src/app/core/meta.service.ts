import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Item, MetaOption } from './models';

export interface TaxCode { id: string; hsnSac: string; gstRate: number; description?: string; }

/** Master-data lookups for select inputs. */
@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  materialGrades() { return this.http.get<MetaOption[]>(`${this.api}/material-grades`); }
  finishes() { return this.http.get<MetaOption[]>(`${this.api}/finishes`); }
  workCenters() { return this.http.get<MetaOption[]>(`${this.api}/work-centers`); }
  operations() { return this.http.get<MetaOption[]>(`${this.api}/operations`); }
  items() { return this.http.get<Item[]>(`${this.api}/items`); }
  taxCodes() { return this.http.get<TaxCode[]>(`${this.api}/tax-codes`); }
}
