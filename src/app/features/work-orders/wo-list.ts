import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PlanningService } from '../../core/planning.service';
import { EngineeringService } from '../../core/engineering.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-wo-list',
  standalone: true,
  imports: [GwCardComponent, GwButtonComponent, GwTableComponent, GwAlertComponent],
  templateUrl: './wo-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WoListPage implements OnInit {
  private readonly svc = inject(PlanningService);
  private readonly eng = inject(EngineeringService);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly running = signal(false);
  readonly mrpMsg = signal('');
  readonly error = signal('');

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'WO #', width: '170px' },
    { key: 'part', label: 'Part' },
    { key: 'qty', label: 'Qty', width: '90px', align: 'right' },
    { key: 'qtyCompleted', label: 'Done', width: '90px', align: 'right' },
    { key: 'status', label: 'Status', width: '130px' },
    { key: 'dueDate', label: 'Due', width: '120px' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ wos: this.svc.workOrders(), parts: this.eng.list() }).subscribe({
      next: ({ wos, parts }) => {
        const byId = new Map(parts.map((p) => [p.id, `${p.partNo}-${p.rev}`]));
        this.rows.set(wos.map((w) => ({ id: w.id, number: w.number, part: byId.get(w.partId) ?? '—', qty: w.qty, qtyCompleted: w.qtyCompleted, status: w.status, dueDate: w.dueDate ?? '—' })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  runMrp(): void {
    this.running.set(true);
    this.mrpMsg.set('');
    this.error.set('');
    this.svc.runMrp().subscribe({
      next: (r) => {
        this.running.set(false);
        this.mrpMsg.set(`MRP planned ${r.workOrders.length} work order(s) and ${r.requisitions.length} requisition(s) from ${r.soLinesPlanned} released SO line(s).`);
        this.load();
      },
      error: (e) => { this.running.set(false); this.error.set(e?.error?.message ?? 'MRP run failed'); },
    });
  }

  open(row: Record<string, unknown>): void { this.router.navigate(['/work-orders', row['id']]); }
}
