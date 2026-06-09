import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { EngineeringService } from '../../core/engineering.service';
import { SalesOrder, SoLine } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

const NEXT: Record<string, string[]> = {
  confirmed: ['in_production', 'cancelled'],
  in_production: ['dispatched', 'cancelled'],
  dispatched: ['invoiced'],
  invoiced: ['closed'],
  closed: [],
  cancelled: [],
};

@Component({
  selector: 'app-so-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './so-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(SalesOrdersService);
  private readonly eng = inject(EngineeringService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly order = signal<SalesOrder | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly parts = signal<GwSelectOption[]>([]);
  readonly planningLineId = signal<string | null>(null);
  readonly partControl = this.fb.control('', { nonNullable: true });

  readonly nextStatuses = computed(() => NEXT[this.order()?.status ?? ''] ?? []);
  readonly openLines = computed<SoLine[]>(() => (this.order()?.lines ?? []).filter((l) => l.status === 'open'));

  readonly columns: GwTableColumn[] = [
    { key: 'lineNo', label: '#', width: '60px' },
    { key: 'partName', label: 'Part' },
    { key: 'qty', label: 'Qty', width: '100px', align: 'right' },
    { key: 'unitPrice', label: 'Unit ₹', width: '120px', align: 'right' },
    { key: 'promisedDate', label: 'Promised', width: '130px' },
    { key: 'status', label: 'Line status', width: '150px' },
  ];

  ngOnInit(): void {
    forkJoin({ order: this.svc.get(this.id), parts: this.eng.list() }).subscribe({
      next: ({ order, parts }) => {
        this.order.set(order);
        this.parts.set(parts.map((p) => ({ value: p.id, label: `${p.partNo}-${p.rev}${p.isReleased ? '' : ' (draft)'}` })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private reload(): void { this.svc.get(this.id).subscribe((o) => this.order.set(o)); }

  advance(status: string): void {
    this.busy.set(true);
    this.error.set('');
    this.svc.setStatus(this.id, status).subscribe({
      next: (o) => { this.order.set(o); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Action failed'); },
    });
  }

  startPlan(lineId: string): void { this.planningLineId.set(lineId); this.partControl.reset(''); this.error.set(''); }

  confirmPlan(): void {
    const partId = this.partControl.value;
    const lineId = this.planningLineId();
    if (!partId || !lineId) return;
    this.busy.set(true);
    this.error.set('');
    this.eng.release(partId, lineId).subscribe({
      next: () => { this.busy.set(false); this.planningLineId.set(null); this.reload(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to release part to plan'); },
    });
  }

  label(s: string): string { return s.replace(/_/g, ' '); }
  statusVariant(s?: string): string {
    return { confirmed: 'info', in_production: 'warning', dispatched: 'primary', invoiced: 'success', closed: 'neutral', cancelled: 'danger' }[s ?? ''] ?? 'neutral';
  }
}
