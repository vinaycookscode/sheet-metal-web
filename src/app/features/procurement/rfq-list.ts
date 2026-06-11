import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RfqService, RfqRow } from '../../core/rfq.service';
import { CatalogService } from '../../core/catalog.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-rfq-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwFormFieldComponent, GwInputComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './rfq-list.html',
  styles: [`.rfq-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border)}.rfq-row:last-child{border-bottom:none}.rfq-main{flex:1}.line-row{display:flex;gap:8px;align-items:end;margin-bottom:8px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfqListPage implements OnInit {
  private readonly svc = inject(RfqService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly rows = signal<RfqRow[]>([]);
  readonly items = signal<GwSelectOption[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showCreate = signal(false);

  readonly form = this.fb.group({
    notes: this.fb.control('', { nonNullable: true }),
    lines: this.fb.array([this.lineGroup()]),
  });
  get lines(): FormArray { return this.form.get('lines') as FormArray; }
  private lineGroup() {
    return this.fb.group({
      itemId: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      qty: this.fb.control(1, { nonNullable: true, validators: [Validators.min(0.001)] }),
    });
  }
  addLine(): void { this.lines.push(this.lineGroup()); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ rows: this.svc.list(), items: this.catalog.items() }).subscribe({
      next: ({ rows, items }) => {
        this.rows.set(rows);
        this.items.set(items.map((i) => ({ value: i.id, label: `${i.code} — ${i.name}` })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    if (this.form.invalid) { this.error.set('Pick an item and qty for each line'); return; }
    const v = this.form.getRawValue();
    this.busy.set(true); this.error.set('');
    this.svc.create({ notes: v.notes || undefined, lines: v.lines.map((l) => ({ itemId: l.itemId, qty: Number(l.qty) })) }).subscribe({
      next: (r) => { this.busy.set(false); this.router.navigate(['/rfqs', r.id]); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to create RFQ'); },
    });
  }

  statusVariant(s: string): string { return { open: 'info', awarded: 'success', closed: 'neutral' }[s] ?? 'neutral'; }
}
