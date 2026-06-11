import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RfqService, RfqDetail, RfqCompareLine } from '../../core/rfq.service';
import { CatalogService } from '../../core/catalog.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-rfq-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwFormFieldComponent, GwInputComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './rfq-detail.html',
  styles: [`.cmp-line{padding:10px 0;border-bottom:1px solid var(--border)}.cmp-line:last-child{border-bottom:none}.q{display:flex;align-items:center;gap:10px;padding:4px 0 4px 12px}.q--best{font-weight:600}.q-spacer{flex:1}.addq{display:flex;gap:8px;align-items:end;flex-wrap:wrap}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfqDetailPage implements OnInit {
  private readonly svc = inject(RfqService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly rfq = signal<RfqDetail | null>(null);
  readonly comparison = signal<RfqCompareLine[]>([]);
  readonly suppliers = signal<GwSelectOption[]>([]);
  readonly lineOpts = signal<GwSelectOption[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly quoteForm = this.fb.group({
    rfqLineId: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    supplierId: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    unitPrice: this.fb.control(0, { nonNullable: true, validators: [Validators.min(0)] }),
    leadDays: this.fb.control(7, { nonNullable: true }),
  });
  readonly awardSupplier = this.fb.control('', { nonNullable: true });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ rfq: this.svc.get(this.id), cmp: this.svc.compare(this.id), suppliers: this.catalog.suppliers() }).subscribe({
      next: ({ rfq, cmp, suppliers }) => {
        this.rfq.set(rfq);
        this.comparison.set(cmp);
        this.lineOpts.set(rfq.lines.map((l) => ({ value: l.id, label: `${l.itemCode} (qty ${l.qty})` })));
        this.suppliers.set(suppliers.map((s) => ({ value: s.id, label: s.name })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addQuote(): void {
    if (this.quoteForm.invalid) { this.error.set('Select line, supplier and price'); return; }
    const v = this.quoteForm.getRawValue();
    this.busy.set(true); this.error.set('');
    this.svc.addQuote(this.id, { rfqLineId: v.rfqLineId, supplierId: v.supplierId, unitPrice: Number(v.unitPrice), leadDays: Number(v.leadDays) }).subscribe({
      next: () => { this.busy.set(false); this.quoteForm.patchValue({ unitPrice: 0 }); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to add quote'); },
    });
  }

  award(): void {
    if (!this.awardSupplier.value) { this.error.set('Select a supplier to award'); return; }
    this.busy.set(true); this.error.set('');
    this.svc.award(this.id, this.awardSupplier.value).subscribe({
      next: (po) => { this.busy.set(false); this.router.navigate(['/purchase-orders', po.id]); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Award failed'); },
    });
  }

  statusVariant(s: string): string { return { open: 'info', awarded: 'success', closed: 'neutral' }[s] ?? 'neutral'; }
}
