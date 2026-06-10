import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../../core/catalog.service';
import { Supplier } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './suppliers-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersPage implements OnInit {
  private readonly svc = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<Supplier[]>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly categories: GwSelectOption[] = [
    { value: 'raw_material', label: 'Raw material' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'subcontract', label: 'Subcontract' },
    { value: 'consumable', label: 'Consumable' },
    { value: 'service', label: 'Service' },
  ];

  readonly columns: GwTableColumn[] = [
    { key: 'code', label: 'Code', width: '130px' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', width: '150px' },
    { key: 'leadTimeDays', label: 'Lead (d)', width: '100px', align: 'right' },
    { key: 'paymentTermsDays', label: 'Terms (d)', width: '100px', align: 'right' },
    { key: 'rating', label: 'Rating', width: '90px', align: 'right' },
  ];

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    gstin: [''],
    stateCode: [''],
    category: ['raw_material'],
    leadTimeDays: [7],
    paymentTermsDays: [30],
    rating: [0],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.suppliers().subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.svc.createSupplier({
      code: v.code,
      name: v.name,
      gstin: v.gstin || undefined,
      stateCode: v.stateCode || undefined,
      category: v.category,
      leadTimeDays: Number(v.leadTimeDays),
      paymentTermsDays: Number(v.paymentTermsDays),
      rating: Number(v.rating) || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset({ category: 'raw_material', leadTimeDays: 7, paymentTermsDays: 30, rating: 0 });
        this.load();
      },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to create supplier'); },
    });
  }
}
