import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FinanceService, SupplierInvoiceRow, ApAging } from '../../core/finance.service';
import { ProcurementService } from '../../core/procurement.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-payables-page',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './payables-page.html',
  styles: [`.aging{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}.si-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}.si-row:last-child{border-bottom:none}.si-main{flex:1;min-width:0}.pay{display:flex;gap:8px;align-items:center;margin:6px 0 10px;padding:8px;background:var(--surface-input);border-radius:8px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayablesPage implements OnInit {
  private readonly svc = inject(FinanceService);
  private readonly proc = inject(ProcurementService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<SupplierInvoiceRow[]>([]);
  readonly aging = signal<ApAging | null>(null);
  readonly pos = signal<GwSelectOption[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly payId = signal<string | null>(null);

  readonly poControl = this.fb.control('', { nonNullable: true });
  readonly refControl = this.fb.control('', { nonNullable: true });
  readonly payAmount = this.fb.control(0, { nonNullable: true });

  readonly agingCols: GwTableColumn[] = [
    { key: 'supplierInvoice', label: 'Invoice', width: '150px' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'outstanding', label: 'Outstanding ₹', width: '150px', align: 'right' },
    { key: 'bucket', label: 'Bucket', width: '110px' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ rows: this.svc.supplierInvoices(), aging: this.svc.apAging(), pos: this.proc.pos() }).subscribe({
      next: ({ rows, aging, pos }) => {
        this.rows.set(rows);
        this.aging.set(aging);
        this.pos.set(pos.map((p) => ({ value: p.id, label: `${p.number} · ₹${p.grandTotal}` })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    if (!this.poControl.value) { this.error.set('Select a purchase order'); return; }
    this.busy.set(true); this.error.set('');
    this.svc.createSupplierInvoice(this.poControl.value, { supplierRef: this.refControl.value || undefined }).subscribe({
      next: () => { this.busy.set(false); this.poControl.reset(''); this.refControl.reset(''); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to create'); },
    });
  }

  match(id: string): void {
    this.busy.set(true); this.error.set('');
    this.svc.matchSupplierInvoice(id).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Match failed'); },
    });
  }
  approve(id: string): void {
    this.busy.set(true); this.error.set('');
    this.svc.approveSupplierInvoice(id).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Approve failed'); },
    });
  }
  startPay(r: SupplierInvoiceRow): void { this.payId.set(r.id); this.payAmount.setValue(Number(r.grandTotal) - Number(r.amountPaid)); this.error.set(''); }
  pay(): void {
    const id = this.payId(); if (!id) return;
    this.busy.set(true); this.error.set('');
    this.svc.recordVendorPayment({ supplierInvoiceId: id, amount: Number(this.payAmount.value), method: 'neft' }).subscribe({
      next: () => { this.busy.set(false); this.payId.set(null); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Payment failed'); },
    });
  }

  matchVariant(s: string): string { return { matched: 'success', variance: 'danger', unmatched: 'neutral' }[s] ?? 'neutral'; }
  statusVariant(s: string): string { return { draft: 'neutral', approved: 'info', partially_paid: 'warning', paid: 'success' }[s] ?? 'neutral'; }
  label(s: string): string { return s.replace(/_/g, ' '); }
}
