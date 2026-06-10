import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { EngineeringService } from '../../core/engineering.service';
import { MetaService } from '../../core/meta.service';
import { SalesOrder, SoLine } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { AuditPanelComponent } from '../../shared/audit-panel/audit-panel';
import { DocumentsPanelComponent } from '../../shared/documents-panel/documents-panel';

const NEXT: Record<string, string[]> = {
  confirmed: ['in_production', 'cancelled'],
  in_production: ['dispatched', 'cancelled'],
  dispatched: ['invoiced'],
  invoiced: ['closed'],
  closed: [],
  cancelled: [],
};

const humanize = (s: string): string => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

@Component({
  selector: 'app-so-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwSelectComponent, GwAlertComponent, AuditPanelComponent, DocumentsPanelComponent],
  templateUrl: './so-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(SalesOrdersService);
  private readonly eng = inject(EngineeringService);
  private readonly meta = inject(MetaService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly order = signal<SalesOrder | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly parts = signal<GwSelectOption[]>([]);
  readonly planningLineId = signal<string | null>(null);
  readonly partControl = this.fb.control('', { nonNullable: true });
  readonly editing = signal(false);
  @ViewChild(AuditPanelComponent) private auditPanel?: AuditPanelComponent;
  readonly taxCodes = signal<GwSelectOption[]>([]);
  readonly editForm = this.fb.nonNullable.group({ customerPoNumber: [''], vendorCode: [''], taxCodeId: [''] });

  readonly nextStatuses = computed(() => NEXT[this.order()?.status ?? ''] ?? []);
  readonly openLines = computed<SoLine[]>(() => (this.order()?.lines ?? []).filter((l) => l.status === 'open'));
  readonly lineRows = computed(() => (this.order()?.lines ?? []).map((l) => ({ ...l, status: humanize(l.status) })));

  readonly columns: GwTableColumn[] = [
    { key: 'lineNo', label: '#', width: '60px' },
    { key: 'partName', label: 'Part' },
    { key: 'qty', label: 'Qty', width: '100px', align: 'right' },
    { key: 'unitPrice', label: 'Unit ₹', width: '120px', align: 'right' },
    { key: 'promisedDate', label: 'Promised', width: '130px' },
    { key: 'status', label: 'Line status', width: '160px' },
  ];

  ngOnInit(): void {
    forkJoin({ order: this.svc.get(this.id), parts: this.eng.list(), taxCodes: this.meta.taxCodes() }).subscribe({
      next: ({ order, parts, taxCodes }) => {
        this.order.set(order);
        this.parts.set(parts.map((p) => ({ value: p.id, label: `${p.partNo}-${p.rev}${p.isReleased ? '' : ' (draft)'}` })));
        this.taxCodes.set(taxCodes.map((t) => ({ value: t.id, label: `${t.hsnSac} · ${t.gstRate}% — ${t.description ?? ''}` })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private reload(): void { this.svc.get(this.id).subscribe((o) => this.order.set(o)); this.auditPanel?.reload(); }

  startEdit(): void {
    const o = this.order();
    this.editForm.reset({ customerPoNumber: o?.customerPoNumber ?? '', vendorCode: o?.vendorCode ?? '', taxCodeId: o?.lines?.[0]?.taxCodeId ?? '' });
    this.editing.set(true);
    this.error.set('');
  }

  saveEdit(): void {
    const v = this.editForm.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.svc.update(this.id, { customerPoNumber: v.customerPoNumber || undefined, vendorCode: v.vendorCode || undefined, taxCodeId: v.taxCodeId || undefined }).subscribe({
      next: (o) => { this.order.set(o); this.busy.set(false); this.editing.set(false); this.auditPanel?.reload(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to save'); },
    });
  }

  advance(status: string): void {
    this.busy.set(true);
    this.error.set('');
    this.svc.setStatus(this.id, status).subscribe({
      next: (o) => { this.order.set(o); this.busy.set(false); this.auditPanel?.reload(); },
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

  label(s: string): string { return humanize(s); }
  statusVariant(s?: string): string {
    return { confirmed: 'info', in_production: 'warning', dispatched: 'primary', invoiced: 'success', closed: 'neutral', cancelled: 'danger' }[s ?? ''] ?? 'neutral';
  }
}
