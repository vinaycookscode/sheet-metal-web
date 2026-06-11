import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PlanningService, CapacityRow } from '../../core/planning.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';

@Component({
  selector: 'app-capacity-page',
  standalone: true,
  imports: [GwCardComponent, GwBadgeComponent, GwButtonComponent, GwTableComponent],
  templateUrl: './capacity-page.html',
  styles: [`
    .wc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-bottom:24px}
    .wc{display:flex;flex-direction:column;gap:8px}
    .wc__head{display:flex;align-items:center;justify-content:space-between}
    .wc__name{font-weight:600}
    .wc__bar{height:8px;border-radius:9999px;background:var(--surface-input);overflow:hidden}
    .wc__fill{height:100%;border-radius:9999px;background:var(--color-primary)}
    .wc__fill--over{background:var(--color-danger)}
    .wc__meta{font-size:12px;color:var(--text-secondary)}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapacityPage implements OnInit {
  private readonly svc = inject(PlanningService);

  readonly board = signal<CapacityRow[]>([]);
  readonly scheduleRows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(true);

  readonly scheduleCols: GwTableColumn[] = [
    { key: 'number', label: 'Work order', width: '180px' },
    { key: 'partNo', label: 'Part' },
    { key: 'totalHrs', label: 'Load (h)', width: '100px', align: 'right' },
    { key: 'promisedDate', label: 'Promised', width: '130px' },
    { key: 'plannedFinish', label: 'Earliest finish', width: '140px' },
    { key: 'onTime', label: 'Status', width: '110px' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ board: this.svc.capacityBoard(), schedule: this.svc.schedule() }).subscribe({
      next: ({ board, schedule }) => {
        this.board.set(board);
        this.scheduleRows.set(schedule.map((s) => ({
          number: s.number, partNo: s.partNo, totalHrs: s.totalHrs,
          promisedDate: s.promisedDate ?? '—', plannedFinish: s.plannedFinish,
          onTime: s.late ? 'Late' : 'On time',
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Bar width: backlog days scaled against a 5-day reference, capped at 100%. */
  fillPct(w: CapacityRow): number { return Math.min(100, (w.backlogDays / 5) * 100); }
}
