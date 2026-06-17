import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AnalyticsService, ProductionIntelligence } from '../../core/analytics.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';

@Component({
  selector: 'app-production-intelligence',
  standalone: true,
  imports: [DecimalPipe, GwCardComponent, GwTableComponent],
  templateUrl: './production-intelligence.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1rem; }
    .stat { font-size:1.7rem; font-weight:700; margin:.25rem 0 0; }
    .stat--oee { color:var(--color-primary,#2563eb); }
    .dt-list { display:flex; flex-direction:column; gap:.5rem; }
    .dt-row { display:flex; justify-content:space-between; gap:1rem; }
    .dt-bar { height:8px; border-radius:4px; background:var(--color-warning,#f59e0b); }
  `],
})
export class ProductionIntelligencePage implements OnInit {
  private readonly svc = inject(AnalyticsService);

  readonly data = signal<ProductionIntelligence | null>(null);
  readonly loading = signal(true);

  readonly columns: GwTableColumn[] = [
    { key: 'workCenter', label: 'Work centre' },
    { key: 'oee', label: 'OEE', align: 'right', width: '90px' },
    { key: 'availability', label: 'Avail.', align: 'right', width: '90px' },
    { key: 'performance', label: 'Perf.', align: 'right', width: '90px' },
    { key: 'quality', label: 'Quality', align: 'right', width: '90px' },
    { key: 'runHours', label: 'Run (h)', align: 'right', width: '90px' },
    { key: 'downtimeHours', label: 'Down (h)', align: 'right', width: '90px' },
    { key: 'good', label: 'Good', align: 'right', width: '80px' },
    { key: 'scrap', label: 'Scrap', align: 'right', width: '80px' },
  ];

  readonly rows = computed(() =>
    (this.data()?.workCenters ?? []).map((w) => ({
      workCenter: w.workCenter,
      oee: this.pct(w.oeePct), availability: this.pct(w.availabilityPct),
      performance: this.pct(w.performancePct), quality: this.pct(w.qualityPct),
      runHours: w.runHours, downtimeHours: w.downtimeHours, good: w.good, scrap: w.scrap,
    })),
  );

  readonly maxReasonHours = computed(() => Math.max(1, ...(this.data()?.downtimeByReason ?? []).map((r) => r.hours)));

  ngOnInit(): void {
    this.svc.production().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  pct(n: number | null): string { return n == null ? '—' : `${n}%`; }
  reasonLabel(r: string): string { return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
}
