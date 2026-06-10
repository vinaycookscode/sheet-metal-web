import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PlanningService } from '../../core/planning.service';
import { MetaService } from '../../core/meta.service';
import { InventoryService } from '../../core/inventory.service';
import { WorkOrder } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';
import { LabelPrintComponent, LabelItem } from '../../shared/label-print/label-print';

@Component({
  selector: 'app-wo-detail',
  standalone: true,
  imports: [RouterLink, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwAlertComponent, GwDrawerComponent, LabelPrintComponent],
  templateUrl: './wo-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WoDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(PlanningService);
  private readonly meta = inject(MetaService);
  private readonly inv = inject(InventoryService);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  private wcMap = new Map<string, string>();
  readonly wo = signal<WorkOrder | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly opRows = signal<Array<Record<string, unknown>>>([]);
  readonly allocations = signal<Array<{ itemId: string; allocated: number; shortfall: number }>>([]);
  readonly issueMsg = signal('');
  readonly showLabel = signal(false);
  readonly labels = computed<LabelItem[]>(() => {
    const w = this.wo();
    return w ? [{ code: `wo:${w.id}`, title: w.number, lines: [`Qty: ${w.qty}`, `Status: ${w.status}`] }] : [];
  });
  printLabel(): void { window.print(); }

  readonly opCols: GwTableColumn[] = [
    { key: 'opNo', label: '#', width: '60px' },
    { key: 'workCenter', label: 'Work center' },
    { key: 'status', label: 'Status', width: '130px' },
    { key: 'qtyGood', label: 'Good', width: '90px', align: 'right' },
    { key: 'qtyScrap', label: 'Scrap', width: '90px', align: 'right' },
  ];

  ngOnInit(): void {
    forkJoin({ wo: this.svc.workOrder(this.id), wc: this.meta.workCenters() }).subscribe({
      next: ({ wo, wc }) => {
        this.wcMap = new Map(wc.map((w) => [w.id, `${w.code} — ${w.name}`]));
        this.setWo(wo);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private setWo(wo: WorkOrder): void {
    this.wo.set(wo);
    this.opRows.set((wo.operations ?? []).map((o) => ({ opNo: o.opNo, workCenter: o.workCenterId ? this.wcMap.get(o.workCenterId) ?? '—' : '—', status: o.status, qtyGood: o.qtyGood, qtyScrap: o.qtyScrap })));
  }

  release(): void {
    this.busy.set(true);
    this.error.set('');
    this.svc.releaseWo(this.id).subscribe({
      next: (res) => { this.setWo(res.workOrder); this.allocations.set(res.allocations); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Release failed'); },
    });
  }

  issue(): void {
    this.busy.set(true);
    this.error.set('');
    this.issueMsg.set('');
    this.inv.issue(this.id).subscribe({
      next: (res) => { this.busy.set(false); this.issueMsg.set(`Issued ${res.length} item(s) to the work order.`); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Issue failed'); },
    });
  }

  statusVariant(s?: string): string {
    return { planned: 'neutral', released: 'info', in_progress: 'warning', completed: 'success', closed: 'neutral', cancelled: 'danger' }[s ?? ''] ?? 'neutral';
  }
}
