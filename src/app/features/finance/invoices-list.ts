import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FinanceService, ArAging } from '../../core/finance.service';
import { DispatchService } from '../../core/dispatch.service';
import { CustomersService } from '../../core/customers.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwTableComponent, GwFormFieldComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './invoices-list.html',
  styles: [`.aging{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesListPage implements OnInit {
  private readonly svc = inject(FinanceService);
  private readonly dispatchSvc = inject(DispatchService);
  private readonly customersSvc = inject(CustomersService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly shipmentControl = this.fb.control('', { nonNullable: true });

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly aging = signal<ArAging | null>(null);
  readonly shipments = signal<GwSelectOption[]>([]);

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'Invoice #', width: '170px' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', width: '130px' },
    { key: 'grandTotal', label: 'Total ₹', width: '130px', align: 'right' },
    { key: 'amountPaid', label: 'Paid ₹', width: '120px', align: 'right' },
  ];
  readonly agingCols: GwTableColumn[] = [
    { key: 'invoice', label: 'Invoice', width: '160px' },
    { key: 'customer', label: 'Customer' },
    { key: 'outstanding', label: 'Outstanding ₹', width: '150px', align: 'right' },
    { key: 'bucket', label: 'Bucket', width: '110px' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ invoices: this.svc.invoices(), customers: this.customersSvc.list(), aging: this.svc.arAging(), shipments: this.dispatchSvc.list('dispatched') }).subscribe({
      next: ({ invoices, customers, aging, shipments }) => {
        const byId = new Map(customers.map((c) => [c.id, `${c.code} — ${c.name}`]));
        this.rows.set(invoices.map((i) => ({ id: i.id, number: i.number, customer: byId.get(i.customerId) ?? i.customerId, status: i.status, grandTotal: i.grandTotal, amountPaid: i.amountPaid })));
        this.aging.set(aging);
        this.shipments.set(shipments.map((s) => ({ value: s.id, label: s.number })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(row: Record<string, unknown>): void { this.router.navigate(['/invoices', row['id']]); }

  createFromShipment(): void {
    if (!this.shipmentControl.value) { this.error.set('Select a dispatched shipment'); return; }
    this.busy.set(true);
    this.error.set('');
    this.svc.fromShipment(this.shipmentControl.value).subscribe({
      next: (inv) => { this.busy.set(false); this.router.navigate(['/invoices', inv.id]); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to create invoice'); },
    });
  }
}
