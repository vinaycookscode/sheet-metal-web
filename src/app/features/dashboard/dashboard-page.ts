import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InquiriesService } from '../../core/inquiries.service';
import { QuotesService } from '../../core/quotes.service';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { CatalogService } from '../../core/catalog.service';
import { CustomersService } from '../../core/customers.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwStatCardComponent } from '../../shared/ui/data/stat-card/stat-card.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { DonutChartComponent, ChartDatum } from '../../shared/charts/donut-chart';
import { BarChartComponent } from '../../shared/charts/bar-chart';

interface Kpi { label: string; value: number; icon: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GwCardComponent, GwStatCardComponent, GwTableComponent, DonutChartComponent, BarChartComponent],
  templateUrl: './dashboard-page.html',
  styles: [`
    .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
    .chart-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-bottom:24px}
    .chart-title{font-size:14px;font-weight:600;margin:0 0 16px;color:var(--text-primary,#111)}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly inquiriesSvc = inject(InquiriesService);
  private readonly quotesSvc = inject(QuotesService);
  private readonly soSvc = inject(SalesOrdersService);
  private readonly catalog = inject(CatalogService);
  private readonly customersSvc = inject(CustomersService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly kpis = signal<Kpi[]>([]);
  readonly recent = signal<Array<Record<string, unknown>>>([]);
  readonly pipeline = signal<ChartDatum[]>([]);
  readonly soStatus = signal<ChartDatum[]>([]);
  readonly stockBars = signal<ChartDatum[]>([]);

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'SO #', width: '170px' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', width: '150px' },
    { key: 'orderDate', label: 'Order date', width: '130px' },
  ];

  ngOnInit(): void {
    forkJoin({
      inquiries: this.inquiriesSvc.list(),
      quotes: this.quotesSvc.list(),
      orders: this.soSvc.list(),
      stock: this.catalog.stockSummary(),
      customers: this.customersSvc.list(),
    }).subscribe({
      next: ({ inquiries, quotes, orders, stock, customers }) => {
        const openSo = orders.filter((o) => !['closed', 'cancelled'].includes(o.status));
        this.kpis.set([
          { label: 'Open inquiries', value: inquiries.filter((i) => ['new', 'estimating'].includes(i.status)).length, icon: 'MessageSquare' },
          { label: 'Active quotes', value: quotes.filter((q) => ['draft', 'sent'].includes(q.status)).length, icon: 'FileText' },
          { label: 'Open sales orders', value: openSo.length, icon: 'ClipboardList' },
          { label: 'In production', value: orders.filter((o) => o.status === 'in_production').length, icon: 'Activity' },
          { label: 'Stock items', value: stock.length, icon: 'Package' },
        ]);

        this.pipeline.set([
          { label: 'Inquiries', value: inquiries.length },
          { label: 'Quotes', value: quotes.length },
          { label: 'Sales Orders', value: orders.length },
        ]);
        const grouped = orders.reduce<Record<string, number>>((acc, o) => ((acc[o.status] = (acc[o.status] ?? 0) + 1), acc), {});
        this.soStatus.set(Object.entries(grouped).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value })));
        this.stockBars.set([...stock].sort((a, b) => b.onHand - a.onHand).slice(0, 6).map((s) => ({ label: s.code, value: s.onHand })));

        const byId = new Map(customers.map((c) => [c.id, `${c.code} — ${c.name}`]));
        this.recent.set(
          [...orders]
            .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
            .slice(0, 6)
            .map((o) => ({ id: o.id, number: o.number, customer: byId.get(o.customerId) ?? o.customerId, status: o.status, orderDate: o.orderDate })),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(row: Record<string, unknown>): void {
    this.router.navigate(['/sales-orders', row['id']]);
  }
}
