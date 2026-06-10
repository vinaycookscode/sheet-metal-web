import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { InquiriesService } from '../../core/inquiries.service';
import { CustomersService } from '../../core/customers.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwIconButtonComponent } from '../../shared/ui/buttons/icon-button/icon-button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwDateInputComponent } from '../../shared/ui/forms/date-input/date-input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-inquiries-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    GwCardComponent, GwButtonComponent, GwIconButtonComponent, GwTableComponent,
    GwFormFieldComponent, GwInputComponent, GwDateInputComponent, GwSelectComponent, GwAlertComponent,
  ],
  templateUrl: './inquiries-list.html',
  styles: [`.line-row{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;align-items:center;margin-bottom:10px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiriesListPage implements OnInit {
  private readonly svc = inject(InquiriesService);
  private readonly customersSvc = inject(CustomersService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly customerOptions = signal<GwSelectOption[]>([]);

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'Inquiry #', width: '160px' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', width: '110px' },
    { key: 'requiredDate', label: 'Required', width: '120px' },
    { key: 'lineCount', label: 'Lines', width: '70px', align: 'right' },
    { key: 'value', label: 'Target value ₹', width: '130px', align: 'right' },
    { key: 'notes', label: 'Notes' },
  ];

  readonly form = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    requiredDate: [''],
    notes: [''],
    lines: this.fb.array([this.newLine()]),
  });

  get lines(): FormArray {
    return this.form.controls.lines;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ inquiries: this.svc.list(), customers: this.customersSvc.list() }).subscribe({
      next: ({ inquiries, customers }) => {
        const byId = new Map(customers.map((c) => [c.id, `${c.code} — ${c.name}`]));
        this.customerOptions.set(customers.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })));
        this.rows.set(
          inquiries.map((i) => {
            const lines = i.lines ?? [];
            const value = lines.reduce((a, l) => a + Number(l.qty ?? 0) * Number(l.targetPrice ?? 0), 0);
            return {
              id: i.id,
              number: i.number,
              customer: byId.get(i.customerId) ?? i.customerId,
              status: i.status,
              requiredDate: i.requiredDate ?? '—',
              lineCount: lines.length,
              value: value ? value.toFixed(2) : '—',
              notes: i.notes ?? '—',
            };
          }),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  newLine() {
    return this.fb.nonNullable.group({
      partName: ['', Validators.required],
      qty: [1, [Validators.required, Validators.min(0.001)]],
      targetPrice: [0],
    });
  }
  addLine(): void { this.lines.push(this.newLine()); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  toggleForm(): void { this.showForm.set(!this.showForm()); this.error.set(''); }

  open(row: Record<string, unknown>): void {
    this.router.navigate(['/inquiries', row['id']]);
  }

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.svc.create({ customerId: v.customerId, requiredDate: v.requiredDate || undefined, notes: v.notes || undefined, lines: v.lines }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset({ customerId: '', requiredDate: '', notes: '' });
        this.lines.clear();
        this.lines.push(this.newLine());
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? 'Failed to create inquiry');
      },
    });
  }
}
