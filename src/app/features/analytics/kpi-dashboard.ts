import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AnalyticsService, Kpis, Profitability } from '../../core/analytics.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [GwCardComponent, GwButtonComponent, GwTableComponent],
  templateUrl: './kpi-dashboard.html',
  styles: [`.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px}.kpi h2{margin:6px 0 0;font-size:26px}.kpi .sub{font-size:12px;color:var(--text-secondary)}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiDashboardPage implements OnInit {
  private readonly svc = inject(AnalyticsService);

  readonly kpis = signal<Kpis | null>(null);
  readonly profit = signal<Profitability | null>(null);
  readonly loading = signal(true);

  readonly cols: GwTableColumn[] = [
    { key: 'number', label: 'Sales order', width: '170px' },
    { key: 'customer', label: 'Customer' },
    { key: 'revenue', label: 'Revenue ₹', width: '120px', align: 'right' },
    { key: 'actualCost', label: 'Actual cost ₹', width: '130px', align: 'right' },
    { key: 'margin', label: 'Margin ₹', width: '120px', align: 'right' },
    { key: 'marginPct', label: 'Margin %', width: '100px', align: 'right' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ kpis: this.svc.kpis(), profit: this.svc.profitability() }).subscribe({
      next: ({ kpis, profit }) => { this.kpis.set(kpis); this.profit.set(profit); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
