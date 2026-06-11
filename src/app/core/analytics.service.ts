import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Kpis {
  revenue: number; arOutstanding: number; apOutstanding: number;
  openWorkOrders: number; openNcrs: number; openOrders: number;
  quotes: number; orders: number; winRatePct: number | null;
}
export interface ProfitabilityRow { number: string; customer: string; status: string; revenue: number; actualCost: number; margin: number; marginPct: number | null; }
export interface Profitability {
  orders: ProfitabilityRow[];
  totals: { revenue: number; actualCost: number; margin: number; marginPct: number | null };
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/analytics`;

  kpis() { return this.http.get<Kpis>(`${this.base}/kpis`); }
  profitability() { return this.http.get<Profitability>(`${this.base}/profitability`); }
}
