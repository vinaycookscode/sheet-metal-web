import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { QualityService } from '../../core/quality.service';
import { CatalogService } from '../../core/catalog.service';
import { Ncr } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwCheckboxComponent } from '../../shared/ui/forms/checkbox/checkbox.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-ncrs-list',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwFormFieldComponent, GwInputComponent, GwCheckboxComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './ncrs-list.html',
  styles: [`
    .ncr-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border,#eee)}
    .ncr-row:last-child{border-bottom:none}
    .dispo{display:flex;align-items:center;gap:8px;padding:8px;background:var(--surface-input,#f4f4f5);border-radius:8px;margin:6px 0}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NcrsListPage implements OnInit {
  private readonly svc = inject(QualityService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  readonly ncrs = signal<Ncr[]>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly suppliers = signal<GwSelectOption[]>([]);
  readonly dispoNcrId = signal<string | null>(null);

  readonly sources: GwSelectOption[] = [
    { value: 'incoming', label: 'Incoming' }, { value: 'in_process', label: 'In process' }, { value: 'final', label: 'Final' }, { value: 'customer', label: 'Customer' },
  ];
  readonly dispositions: GwSelectOption[] = [
    { value: 'use_as_is', label: 'Use as is' }, { value: 'rework', label: 'Rework' }, { value: 'scrap', label: 'Scrap' }, { value: 'return_to_supplier', label: 'Return to supplier' },
  ];

  readonly form = this.fb.nonNullable.group({
    source: ['final', Validators.required],
    defect: ['', Validators.required],
    isCritical: [false],
    supplierId: [''],
  });
  readonly dispoControl = this.fb.control('', { nonNullable: true });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ ncrs: this.svc.ncrs(), suppliers: this.catalog.suppliers() }).subscribe({
      next: ({ ncrs, suppliers }) => {
        this.ncrs.set(ncrs);
        this.suppliers.set(suppliers.map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void { this.showForm.set(!this.showForm()); this.error.set(''); }

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.svc.createNcr({ source: v.source, defect: v.defect, isCritical: v.isCritical, supplierId: v.supplierId || undefined }).subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.form.reset({ source: 'final', defect: '', isCritical: false, supplierId: '' }); this.load(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to raise NCR'); },
    });
  }

  startDispo(id: string): void { this.dispoNcrId.set(id); this.dispoControl.reset(''); this.error.set(''); }

  confirmDispo(): void {
    const id = this.dispoNcrId();
    if (!id || !this.dispoControl.value) { this.error.set('Pick a disposition'); return; }
    this.busy.set(true);
    this.svc.disposition(id, { disposition: this.dispoControl.value }).subscribe({
      next: () => { this.busy.set(false); this.dispoNcrId.set(null); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Disposition failed'); },
    });
  }

  close(id: string): void {
    this.busy.set(true);
    this.error.set('');
    this.svc.closeNcr(id).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Close failed'); },
    });
  }

  statusVariant(s: string): string { return { open: 'warning', dispositioned: 'info', closed: 'success' }[s] ?? 'neutral'; }
}
