import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EngineeringService } from '../../core/engineering.service';
import { MetaService } from '../../core/meta.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwIconButtonComponent } from '../../shared/ui/buttons/icon-button/icon-button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-parts-list',
  standalone: true,
  imports: [
    ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwIconButtonComponent, GwTableComponent,
    GwFormFieldComponent, GwInputComponent, GwSelectComponent, GwAlertComponent,
  ],
  templateUrl: './parts-list.html',
  styles: [`
    .line-row{display:grid;gap:10px;align-items:center;margin-bottom:10px}
    .routing-row{grid-template-columns:2fr 2fr 1fr auto}
    .bom-row{grid-template-columns:3fr 1fr auto}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartsListPage implements OnInit {
  private readonly svc = inject(EngineeringService);
  private readonly meta = inject(MetaService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly grades = signal<GwSelectOption[]>([]);
  readonly finishes = signal<GwSelectOption[]>([]);
  readonly operations = signal<GwSelectOption[]>([]);
  readonly workCenters = signal<GwSelectOption[]>([]);
  readonly items = signal<GwSelectOption[]>([]);

  readonly columns: GwTableColumn[] = [
    { key: 'partNo', label: 'Part No', width: '160px' },
    { key: 'rev', label: 'Rev', width: '70px', align: 'center' },
    { key: 'description', label: 'Description' },
    { key: 'released', label: 'State', width: '110px' },
  ];

  readonly form = this.fb.nonNullable.group({
    partNo: ['', Validators.required],
    description: [''],
    materialGradeId: [''],
    thicknessMm: [null as number | null],
    finishId: [''],
    routing: this.fb.array([this.newRouting()]),
    bom: this.fb.array([this.newBom()]),
  });

  get routing(): FormArray { return this.form.controls.routing; }
  get bom(): FormArray { return this.form.controls.bom; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({
      parts: this.svc.list(),
      grades: this.meta.materialGrades(), finishes: this.meta.finishes(),
      operations: this.meta.operations(), workCenters: this.meta.workCenters(), items: this.meta.items(),
    }).subscribe({
      next: (r) => {
        const opt = (a: { id: string; code: string; name: string }[]) => a.map((x) => ({ value: x.id, label: `${x.code} — ${x.name}` }));
        this.grades.set(opt(r.grades)); this.finishes.set(opt(r.finishes));
        this.operations.set(opt(r.operations)); this.workCenters.set(opt(r.workCenters)); this.items.set(opt(r.items));
        this.rows.set(r.parts.map((p) => ({ id: p.id, partNo: p.partNo, rev: p.rev, description: p.description ?? '—', released: p.isReleased ? 'Released' : 'Draft' })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  newRouting() { return this.fb.nonNullable.group({ operationId: [''], workCenterId: [''], runSecondsPerUnit: [0] }); }
  newBom() { return this.fb.nonNullable.group({ componentItemId: [''], qtyPer: [1, Validators.min(0.0001)] }); }
  addRouting(): void { this.routing.push(this.newRouting()); }
  removeRouting(i: number): void { if (this.routing.length > 1) this.routing.removeAt(i); }
  addBom(): void { this.bom.push(this.newBom()); }
  removeBom(i: number): void { if (this.bom.length > 1) this.bom.removeAt(i); }

  toggleForm(): void { this.showForm.set(!this.showForm()); this.error.set(''); }
  open(row: Record<string, unknown>): void { this.router.navigate(['/parts', row['id']]); }

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    const routing = v.routing.filter((r) => r.operationId || r.workCenterId).map((r) => ({ operationId: r.operationId || undefined, workCenterId: r.workCenterId || undefined, runSecondsPerUnit: r.runSecondsPerUnit }));
    const bom = v.bom.filter((b) => b.componentItemId).map((b) => ({ componentItemId: b.componentItemId, qtyPer: b.qtyPer }));
    this.svc.create({
      partNo: v.partNo, description: v.description || undefined,
      materialGradeId: v.materialGradeId || undefined, thicknessMm: v.thicknessMm ?? undefined, finishId: v.finishId || undefined,
      routing, bom,
    }).subscribe({
      next: (p) => { this.saving.set(false); this.router.navigate(['/parts', p.id]); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to create part'); },
    });
  }
}
