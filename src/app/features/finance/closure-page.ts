import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FinanceService, ClosureReport } from '../../core/finance.service';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-closure-page',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwTableComponent, GwFormFieldComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './closure-page.html',
  styles: [`.totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosurePage implements OnInit {
  private readonly svc = inject(FinanceService);
  private readonly soSvc = inject(SalesOrdersService);
  private readonly fb = inject(FormBuilder);

  readonly soOptions = signal<GwSelectOption[]>([]);
  readonly report = signal<ClosureReport | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly soControl = this.fb.control('', { nonNullable: true });

  readonly cols: GwTableColumn[] = [
    { key: 'partName', label: 'Part' },
    { key: 'revenue', label: 'Revenue ₹', width: '120px', align: 'right' },
    { key: 'estimatedCost', label: 'Estimate ₹', width: '120px', align: 'right' },
    { key: 'actualCost', label: 'Actual ₹', width: '120px', align: 'right' },
    { key: 'margin', label: 'Margin ₹', width: '120px', align: 'right' },
    { key: 'variance', label: 'Variance ₹', width: '120px', align: 'right' },
  ];

  ngOnInit(): void {
    this.soSvc.list().subscribe((orders) => this.soOptions.set(orders.map((o) => ({ value: o.id, label: `${o.number} (${o.status})` }))));
  }

  view(): void {
    if (!this.soControl.value) return;
    this.busy.set(true);
    this.error.set('');
    this.svc.closureReport(this.soControl.value).subscribe({
      next: (r) => { this.report.set(r); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to load report'); },
    });
  }

  close(): void {
    if (!this.soControl.value) return;
    this.busy.set(true);
    this.error.set('');
    this.svc.closeSo(this.soControl.value).subscribe({
      next: (r) => { this.report.set(r); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Close failed'); },
    });
  }
}
