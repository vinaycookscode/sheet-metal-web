import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DispatchService } from '../../core/dispatch.service';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwCheckboxComponent } from '../../shared/ui/forms/checkbox/checkbox.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

interface LineMeta { id: string; label: string; }

@Component({
  selector: 'app-shipments-list',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwCheckboxComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './shipments-list.html',
  styles: [`.pack-row{display:grid;grid-template-columns:auto 2fr 1fr 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border,#eee)}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentsListPage implements OnInit {
  private readonly svc = inject(DispatchService);
  private readonly soSvc = inject(SalesOrdersService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly soOptions = signal<GwSelectOption[]>([]);
  readonly lineMeta = signal<LineMeta[]>([]);

  readonly soControl = this.fb.control('', { nonNullable: true });
  readonly packs = this.fb.array<FormGroup>([]);

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'DC #', width: '170px' },
    { key: 'so', label: 'Sales order' },
    { key: 'status', label: 'Status', width: '130px' },
    { key: 'dispatchDate', label: 'Dispatch date', width: '140px' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ shipments: this.svc.list(), orders: this.soSvc.list() }).subscribe({
      next: ({ shipments, orders }) => {
        const byId = new Map(orders.map((o) => [o.id, o.number]));
        this.rows.set(shipments.map((s) => ({ id: s.id, number: s.number, so: byId.get(s.salesOrderId) ?? s.salesOrderId, status: s.status, dispatchDate: s.dispatchDate ?? '—' })));
        this.soOptions.set(orders.filter((o) => ['confirmed', 'in_production'].includes(o.status)).map((o) => ({ value: o.id, label: o.number })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void { this.showForm.set(!this.showForm()); this.error.set(''); this.packs.clear(); this.lineMeta.set([]); this.soControl.reset(''); }

  loadLines(): void {
    const soId = this.soControl.value;
    if (!soId) return;
    this.soSvc.get(soId).subscribe((o) => {
      const lines = o.lines ?? [];
      this.lineMeta.set(lines.map((l) => ({ id: l.id, label: `Line ${l.lineNo} · ${l.partName} · qty ${l.qty}` })));
      this.packs.clear();
      lines.forEach((l) => this.packs.push(this.fb.group({ include: [true], qty: [l.qty], weightKg: [null as number | null] })));
    });
  }

  open(row: Record<string, unknown>): void { this.router.navigate(['/shipments', row['id']]); }

  create(): void {
    const soId = this.soControl.value;
    const lines = this.packs.controls
      .map((c, i) => ({ include: c.value.include as boolean, soLineId: this.lineMeta()[i].id, qty: Number(c.value.qty), weightKg: c.value.weightKg != null ? Number(c.value.weightKg) : undefined }))
      .filter((l) => l.include && l.qty > 0)
      .map((l) => ({ soLineId: l.soLineId, qty: l.qty, weightKg: l.weightKg }));
    if (!soId || !lines.length) { this.error.set('Select an order and at least one line'); return; }
    this.saving.set(true);
    this.error.set('');
    this.svc.create({ salesOrderId: soId, lines }).subscribe({
      next: (s) => { this.saving.set(false); this.router.navigate(['/shipments', s.id]); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to create shipment'); },
    });
  }
}
