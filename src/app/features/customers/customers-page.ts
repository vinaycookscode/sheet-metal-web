import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomersService } from '../../core/customers.service';
import { Customer } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    GwCardComponent,
    GwButtonComponent,
    GwTableComponent,
    GwFormFieldComponent,
    GwInputComponent,
    GwAlertComponent,
  ],
  templateUrl: './customers-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage implements OnInit {
  private readonly svc = inject(CustomersService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly columns: GwTableColumn[] = [
    { key: 'code', label: 'Code', width: '130px' },
    { key: 'name', label: 'Name' },
    { key: 'gstin', label: 'GSTIN', width: '170px' },
    { key: 'stateCode', label: 'State', width: '70px', align: 'center' },
    { key: 'paymentTermsDays', label: 'Terms (d)', width: '100px', align: 'right' },
    { key: 'creditLimit', label: 'Credit ₹', width: '140px', align: 'right' },
  ];

  readonly form = this.fb.nonNullable.group({
    code: [''],
    name: ['', Validators.required],
    gstin: [''],
    stateCode: [''],
    paymentTermsDays: [30],
    creditLimit: [0],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    this.error.set('');
  }

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.svc.create({ ...v, code: v.code || undefined }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset({ code: '', name: '', gstin: '', stateCode: '', paymentTermsDays: 30, creditLimit: 0 });
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? 'Failed to save customer');
      },
    });
  }
}
