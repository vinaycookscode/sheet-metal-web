import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { QuotesService } from '../../core/quotes.service';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { Quote, QuoteVersion, SendQuoteEmailResult } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';
import { GwDialogComponent } from '../../shared/ui/overlays/dialog/dialog.component';
import { NextActionBarComponent } from '../../shared/next-action-bar/next-action-bar';
import { JOURNEY_STAGES } from '../../shared/next-action-bar/journey';
import { QuotePrintPage } from './quote-print';

@Component({
  selector: 'app-quote-detail',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent,
    GwAlertComponent, GwFormFieldComponent, GwInputComponent, GwDrawerComponent, GwDialogComponent,
    NextActionBarComponent, QuotePrintPage,
  ],
  templateUrl: './quote-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(QuotesService);
  private readonly soSvc = inject(SalesOrdersService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly quote = signal<Quote | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');

  // Preview drawer + send-email dialog
  readonly showDoc = signal(false);
  readonly showSend = signal(false);
  readonly sending = signal(false);
  readonly sendError = signal('');
  readonly sendResult = signal<SendQuoteEmailResult | null>(null);
  readonly sendForm = this.fb.nonNullable.group({ to: [''], subject: [''], body: [''] });
  printDoc(): void { window.print(); }

  readonly current = computed<QuoteVersion | null>(() => this.quote()?.versions?.find((v) => v.isCurrent) ?? null);

  readonly journeyStages = JOURNEY_STAGES;
  /** A forward action is available (open the order, or a draft/sent/accepted step). */
  readonly hasActions = computed(() => !!this.quote()?.salesOrder || ['draft', 'sent', 'accepted'].includes(this.quote()?.status ?? ''));
  /** Plain-language "what to do next" for the guided bar. */
  readonly hint = computed(() => {
    const q = this.quote();
    if (q?.salesOrder) return `Converted to sales order ${q.salesOrder.number} — open it to continue.`;
    switch (q?.status) {
      case 'draft': return 'Send the quote to the customer.';
      case 'sent': return "Awaiting the customer's decision — accept it, then create the sales order.";
      case 'accepted': return 'Accepted — create the sales order.';
      case 'rejected': return 'Rejected — no further action.';
      case 'expired': return 'Expired — revise it to re-quote.';
      default: return undefined;
    }
  });

  readonly columns: GwTableColumn[] = [
    { key: 'lineNo', label: '#', width: '60px' },
    { key: 'partName', label: 'Part' },
    { key: 'primaryQty', label: 'Qty', width: '100px', align: 'right' },
    { key: 'unitPrice', label: 'Unit ₹', width: '120px', align: 'right' },
    { key: 'marginPct', label: 'Margin %', width: '110px', align: 'right' },
  ];

  ngOnInit(): void {
    this.svc.get(this.id).subscribe({
      next: (q) => { this.quote.set(q); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setStatus(s: 'sent' | 'accepted' | 'rejected'): void { this.act(this.svc.setStatus(this.id, s)); }

  /** Open the compose dialog, pre-filled from the quote document (recipient, subject, body). */
  openSend(): void {
    this.sendError.set('');
    this.sendResult.set(null);
    this.svc.document(this.id).subscribe({
      next: (d) => {
        this.sendForm.setValue({
          to: d.buyer.email ?? '',
          subject: `Quotation ${d.number}`,
          body: `Dear ${d.buyer.name},\n\nPlease find attached our quotation ${d.number}.\n\nRegards,\n${d.seller.name}`,
        });
        this.showSend.set(true);
      },
      error: () => {
        this.sendForm.setValue({ to: '', subject: `Quotation ${this.quote()?.number ?? ''}`, body: '' });
        this.showSend.set(true);
      },
    });
  }

  send(): void {
    if (this.sending()) return;
    this.sending.set(true);
    this.sendError.set('');
    const v = this.sendForm.getRawValue();
    this.svc.sendEmail(this.id, { to: v.to || undefined, subject: v.subject || undefined, body: v.body || undefined }).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.sendResult.set(res);
        this.svc.get(this.id).subscribe((q) => this.quote.set(q)); // reflect 'sent'
      },
      error: (e) => { this.sending.set(false); this.sendError.set(e?.error?.message ?? 'Failed to send the email'); },
    });
  }

  createSO(): void {
    const v = this.current();
    if (!v) return;
    this.busy.set(true);
    this.error.set('');
    this.soSvc.fromQuote(v.id).subscribe({
      next: (so) => this.router.navigate(['/sales-orders', so.id]),
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to create sales order'); },
    });
  }

  private act(obs: Observable<Quote>): void {
    this.busy.set(true);
    this.error.set('');
    obs.subscribe({
      next: (q) => { this.quote.set(q); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Action failed'); },
    });
  }

  statusVariant(s?: string): string {
    return { draft: 'neutral', sent: 'info', accepted: 'success', rejected: 'danger', expired: 'warning' }[s ?? ''] ?? 'neutral';
  }
}
