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

export interface OeeWorkCenter {
  workCenterId: string; workCenter: string;
  runHours: number; downtimeHours: number; good: number; scrap: number;
  availabilityPct: number | null; performancePct: number | null; qualityPct: number | null; oeePct: number | null;
}
export interface ProductionIntelligence {
  from: string; to: string;
  plant: {
    oeePct: number | null; availabilityPct: number | null; performancePct: number | null; qualityPct: number | null;
    scrapPct: number | null; yieldPct: number | null; runHours: number; downtimeHours: number; good: number; scrap: number; wip: number;
  };
  workCenters: OeeWorkCenter[];
  downtimeByReason: Array<{ reason: string; hours: number; count: number }>;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/analytics`;

  kpis() { return this.http.get<Kpis>(`${this.base}/kpis`); }
  profitability() { return this.http.get<Profitability>(`${this.base}/profitability`); }
  production(from?: string, to?: string) {
    const qs = [from ? `from=${from}` : '', to ? `to=${to}` : ''].filter(Boolean).join('&');
    return this.http.get<ProductionIntelligence>(`${this.base}/production${qs ? '?' + qs : ''}`);
  }
}
