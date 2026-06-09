import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EngineeringService } from '../../core/engineering.service';
import { MetaService } from '../../core/meta.service';
import { Part } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-part-detail',
  standalone: true,
  imports: [RouterLink, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwAlertComponent],
  templateUrl: './part-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(EngineeringService);
  private readonly meta = inject(MetaService);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly part = signal<Part | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly routingRows = signal<Array<Record<string, unknown>>>([]);
  readonly bomRows = signal<Array<Record<string, unknown>>>([]);
  readonly explodeRows = signal<Array<Record<string, unknown>>>([]);

  readonly routingCols: GwTableColumn[] = [
    { key: 'opNo', label: '#', width: '60px' },
    { key: 'operation', label: 'Operation' },
    { key: 'workCenter', label: 'Work center' },
    { key: 'runSecondsPerUnit', label: 'Run s/unit', width: '110px', align: 'right' },
  ];
  readonly bomCols: GwTableColumn[] = [
    { key: 'component', label: 'Component' },
    { key: 'qtyPer', label: 'Qty per', width: '110px', align: 'right' },
    { key: 'scrapPct', label: 'Scrap %', width: '100px', align: 'right' },
  ];
  readonly explodeCols: GwTableColumn[] = [
    { key: 'type', label: 'Type', width: '90px' },
    { key: 'ref', label: 'Component' },
    { key: 'qtyRequired', label: 'Qty required', width: '130px', align: 'right' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ part: this.svc.get(this.id), operations: this.meta.operations(), workCenters: this.meta.workCenters(), items: this.meta.items() }).subscribe({
      next: ({ part, operations, workCenters, items }) => {
        const op = new Map(operations.map((o) => [o.id, `${o.code} — ${o.name}`]));
        const wc = new Map(workCenters.map((w) => [w.id, `${w.code} — ${w.name}`]));
        const it = new Map(items.map((i) => [i.id, `${i.code} — ${i.name}`]));
        this.part.set(part);
        this.routingRows.set((part.routingOps ?? []).map((r) => ({ opNo: r.opNo, operation: r.operationId ? op.get(r.operationId) ?? '—' : '—', workCenter: r.workCenterId ? wc.get(r.workCenterId) ?? '—' : '—', runSecondsPerUnit: r.runSecondsPerUnit })));
        this.bomRows.set((part.bomLines ?? []).map((b) => ({ component: b.componentItemId ? it.get(b.componentItemId) ?? 'item' : 'sub-assembly', qtyPer: b.qtyPer, scrapPct: b.scrapPct })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  release(): void {
    this.busy.set(true);
    this.error.set('');
    this.svc.release(this.id).subscribe({
      next: (p) => { this.part.set(p); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Release failed'); },
    });
  }

  explode(): void {
    this.svc.explode(this.id, 10).subscribe({
      next: (res) => this.explodeRows.set((res.components as Array<Record<string, unknown>>).map((c) => ({ type: c['type'], ref: c['ref'], qtyRequired: c['qtyRequired'] }))),
      error: (e) => this.error.set(e?.error?.message ?? 'Explode failed'),
    });
  }

  statusVariant(released?: boolean): string { return released ? 'success' : 'neutral'; }
}
