import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProcurementService } from '../../core/procurement.service';
import { PlanningService } from '../../core/planning.service';
import { CatalogService } from '../../core/catalog.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwCheckboxComponent } from '../../shared/ui/forms/checkbox/checkbox.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

interface ReqMeta { id: string; item: string; qty: number; }

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [
    ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwTableComponent,
    GwFormFieldComponent, GwInputComponent, GwCheckboxComponent, GwSelectComponent, GwAlertComponent,
  ],
  templateUrl: './po-list.html',
  styles: [`.req-row{display:grid;grid-template-columns:auto 2fr 1fr 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border,#eee)}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoListPage implements OnInit {
  private readonly svc = inject(ProcurementService);
  private readonly planning = inject(PlanningService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly suppliers = signal<GwSelectOption[]>([]);
  readonly openReqs = signal<ReqMeta[]>([]);

  readonly supplierControl = this.fb.control('', { nonNullable: true, validators: [Validators.required] });
  readonly reqs = this.fb.array<FormGroup>([]);

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'PO #', width: '170px' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'status', label: 'Status', width: '150px' },
    { key: 'grandTotal', label: 'Total ₹', width: '140px', align: 'right' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ pos: this.svc.pos(), reqs: this.planning.requisitions(false), suppliers: this.catalog.suppliers(), items: this.catalog.items() }).subscribe({
      next: ({ pos, reqs, suppliers, items }) => {
        const supMap = new Map(suppliers.map((s) => [s.id, `${s.code} — ${s.name}`]));
        const itemMap = new Map(items.map((i) => [i.id, `${i.code} — ${i.name}`]));
        this.suppliers.set(suppliers.map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` })));
        this.rows.set(pos.map((p) => ({ id: p.id, number: p.number, supplier: supMap.get(p.supplierId) ?? p.supplierId, status: p.status, grandTotal: p.grandTotal })));
        this.openReqs.set(reqs.map((r) => ({ id: r.id, item: itemMap.get(r.itemId) ?? r.itemId, qty: r.qty })));
        this.reqs.clear();
        reqs.forEach(() => this.reqs.push(this.fb.group({ include: [false], unitPrice: [0] })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void { this.showForm.set(!this.showForm()); this.error.set(''); }
  open(row: Record<string, unknown>): void { this.router.navigate(['/purchase-orders', row['id']]); }

  createPo(): void {
    const supplierId = this.supplierControl.value;
    const lines = this.reqs.controls
      .map((c, i) => ({ include: c.value.include as boolean, requisitionId: this.openReqs()[i].id, unitPrice: Number(c.value.unitPrice) }))
      .filter((l) => l.include)
      .map((l) => ({ requisitionId: l.requisitionId, unitPrice: l.unitPrice }));
    if (!supplierId) { this.error.set('Select a supplier'); return; }
    if (!lines.length) { this.error.set('Select at least one requisition'); return; }
    this.saving.set(true);
    this.error.set('');
    this.svc.fromRequisitions(supplierId, lines).subscribe({
      next: (po) => { this.saving.set(false); this.router.navigate(['/purchase-orders', po.id]); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to create PO'); },
    });
  }
}
