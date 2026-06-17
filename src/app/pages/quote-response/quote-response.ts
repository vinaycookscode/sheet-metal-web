import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PublicQuoteService } from '../../core/public-quote.service';
import { PublicQuoteView, PublicRespond } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

type Mode = 'view' | 'accept' | 'reject' | 'negotiate' | 'done';

@Component({
  selector: 'app-quote-response',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, GwCardComponent, GwButtonComponent,
    GwInputComponent, GwFormFieldComponent, GwSelectComponent, GwAlertComponent,
  ],
  templateUrl: './quote-response.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display:block; min-height:100vh; background:var(--surface-muted,#f5f6f8); padding:2rem 1rem; }
    .wrap { max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:1rem; }
    .brand { text-align:center; margin-bottom:.5rem; }
    .brand h1 { margin:0; font-size:1.2rem; }
    .brand p { margin:.15rem 0 0; color:var(--text-secondary,#666); }
    table.lines { width:100%; border-collapse:collapse; font-size:.9rem; }
    table.lines th, table.lines td { padding:8px 6px; border-bottom:1px solid var(--border,#e5e7eb); text-align:left; }
    table.lines td.r, table.lines th.r { text-align:right; }
    .totals { margin-top:.75rem; margin-left:auto; width:280px; }
    .totals tr td { padding:4px 0; }
    .totals tr.grand td { font-weight:700; font-size:1.05rem; border-top:1px solid var(--border,#e5e7eb); padding-top:8px; }
    .actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .muted { color:var(--text-secondary,#666); }
    .resp-form { display:flex; flex-direction:column; gap:12px; }
    textarea { width:100%; padding:8px 10px; border:1px solid var(--border,#e5e7eb); border-radius:8px; font:inherit; resize:vertical; }
  `],
})
export class QuoteResponsePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(PublicQuoteService);
  private readonly fb = inject(FormBuilder);

  private readonly token = this.route.snapshot.paramMap.get('token')!;
  readonly view = signal<PublicQuoteView | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly mode = signal<Mode>('view');
  readonly submitting = signal(false);
  readonly resultStatus = signal('');

  readonly rejectReasons: GwSelectOption[] = [
    { value: 'price', label: 'Price too high' },
    { value: 'lead_time', label: 'Lead time too long' },
    { value: 'scope', label: 'Scope / specs not right' },
    { value: 'went_elsewhere', label: 'Going with another supplier' },
    { value: 'no_longer_required', label: 'No longer required' },
    { value: 'other', label: 'Other' },
  ];
  readonly rejectForm = this.fb.nonNullable.group({ rejectReason: 'price', message: '' });
  readonly negotiateForm = this.fb.nonNullable.group({ counterAmount: [null as number | null], message: '' });

  ngOnInit(): void {
    this.svc.view(this.token).subscribe({
      next: (v) => { this.view.set(v); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'This quotation link is invalid or has expired.'); this.loading.set(false); },
    });
  }

  private submit(dto: PublicRespond): void {
    this.submitting.set(true);
    this.error.set('');
    this.svc.respond(this.token, dto).subscribe({
      next: (r) => { this.submitting.set(false); this.resultStatus.set(r.status); this.mode.set('done'); },
      error: (e) => { this.submitting.set(false); this.error.set(e?.error?.message ?? 'Could not submit your response. Please try again.'); },
    });
  }

  accept(): void { this.submit({ action: 'accept' }); }
  reject(): void {
    const v = this.rejectForm.getRawValue();
    this.submit({ action: 'reject', rejectReason: v.rejectReason, message: v.message || undefined });
  }
  negotiate(): void {
    const v = this.negotiateForm.getRawValue();
    this.submit({ action: 'negotiate', counterAmount: v.counterAmount ?? undefined, message: v.message || undefined });
  }
}
