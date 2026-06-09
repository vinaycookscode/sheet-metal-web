import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { QualityService } from '../../core/quality.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwIconButtonComponent } from '../../shared/ui/buttons/icon-button/icon-button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-inspections-list',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwIconButtonComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './inspections-list.html',
  styles: [`.char-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:10px;align-items:center;margin-bottom:10px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionsListPage implements OnInit {
  private readonly svc = inject(QualityService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly kinds: GwSelectOption[] = [
    { value: 'incoming', label: 'Incoming' }, { value: 'in_process', label: 'In process' }, { value: 'final', label: 'Final' },
  ];

  readonly columns: GwTableColumn[] = [
    { key: 'kind', label: 'Kind', width: '130px' },
    { key: 'result', label: 'Result', width: '120px' },
    { key: 'chars', label: 'Characteristics', width: '140px', align: 'right' },
    { key: 'inspectedAt', label: 'Inspected', width: '180px' },
  ];

  readonly form = this.fb.nonNullable.group({
    kind: ['final', Validators.required],
    characteristics: this.fb.array([this.newChar()]),
  });
  get characteristics(): FormArray { return this.form.controls.characteristics; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.inspections().subscribe({
      next: (list) => { this.rows.set(list.map((i) => ({ id: i.id, kind: i.kind, result: i.result, chars: i.characteristics?.length ?? 0, inspectedAt: i.inspectedAt ?? '—' }))); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  newChar() { return this.fb.nonNullable.group({ characteristic: ['', Validators.required], nominal: [null as number | null], tolerancePlus: [null as number | null], toleranceMinus: [null as number | null] }); }
  addChar(): void { this.characteristics.push(this.newChar()); }
  removeChar(i: number): void { if (this.characteristics.length > 1) this.characteristics.removeAt(i); }
  toggleForm(): void { this.showForm.set(!this.showForm()); this.error.set(''); }
  open(row: Record<string, unknown>): void { this.router.navigate(['/inspections', row['id']]); }

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    const characteristics = v.characteristics.map((c) => ({ characteristic: c.characteristic, nominal: c.nominal ?? undefined, tolerancePlus: c.tolerancePlus ?? undefined, toleranceMinus: c.toleranceMinus ?? undefined }));
    this.svc.createInspection({ kind: v.kind, characteristics }).subscribe({
      next: (i) => { this.saving.set(false); this.router.navigate(['/inspections', i.id]); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to create inspection'); },
    });
  }
}
