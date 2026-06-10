import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceService } from '../../core/finance.service';
import { Invoice } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';
import { InvoicePrintPage } from './invoice-print';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwAlertComponent, GwDrawerComponent, InvoicePrintPage],
  templateUrl: './invoice-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(FinanceService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly inv = signal<Invoice | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showPay = signal(false);
  readonly showDoc = signal(false);
  printDoc(): void { window.print(); }

  readonly payForm = this.fb.nonNullable.group({ amount: [0, [Validators.required, Validators.min(0.01)]], method: ['neft'] });

  readonly lineCols: GwTableColumn[] = [
    { key: 'lineNo', label: '#', width: '60px' },
    { key: 'description', label: 'Description' },
    { key: 'qty', label: 'Qty', width: '90px', align: 'right' },
    { key: 'unitPrice', label: 'Unit ₹', width: '110px', align: 'right' },
    { key: 'taxableValue', label: 'Taxable ₹', width: '120px', align: 'right' },
    { key: 'taxAmount', label: 'Tax ₹', width: '110px', align: 'right' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.svc.invoice(this.id).subscribe({
      next: (i) => { this.inv.set(i); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  issue(): void {
    this.busy.set(true);
    this.error.set('');
    this.svc.issue(this.id).subscribe({
      next: (i) => { this.inv.set(i); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Issue failed'); },
    });
  }

  pay(): void {
    const inv = this.inv();
    if (!inv || this.payForm.invalid) return;
    this.busy.set(true);
    this.error.set('');
    const v = this.payForm.getRawValue();
    this.svc.recordPayment({ customerId: inv.customerId, invoiceId: inv.id, amount: v.amount, method: v.method }).subscribe({
      next: () => { this.busy.set(false); this.showPay.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Payment failed'); },
    });
  }

  statusVariant(s?: string): string {
    return { draft: 'neutral', issued: 'info', partially_paid: 'warning', paid: 'success', cancelled: 'danger' }[s ?? ''] ?? 'neutral';
  }
  label(s: string): string { return s.replace(/_/g, ' '); }
}
