import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { QuotesService } from '../../core/quotes.service';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { Quote, QuoteVersion, QuoteFollowup, SendQuoteEmailResult } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwDateInputComponent } from '../../shared/ui/forms/date-input/date-input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';
import { GwDialogComponent } from '../../shared/ui/overlays/dialog/dialog.component';
import { NextActionBarComponent } from '../../shared/next-action-bar/next-action-bar';
import { JOURNEY_STAGES } from '../../shared/next-action-bar/journey';
import { QuotePrintPage } from './quote-print';

@Component({
  selector: 'app-quote-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent,
    GwAlertComponent, GwFormFieldComponent, GwInputComponent, GwDateInputComponent, GwSelectComponent,
    GwDrawerComponent, GwDialogComponent, NextActionBarComponent, QuotePrintPage,
  ],
  templateUrl: './quote-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .timeline { display:flex; flex-direction:column; gap:1rem; }
    .tl-row { display:flex; gap:.75rem; }
    .tl-dot { width:10px; height:10px; border-radius:50%; background:var(--color-primary,#2563eb); margin-top:5px; flex:none; }
    .tl-body { flex:1; }
    .tl-head { font-size:.9rem; margin-bottom:.15rem; }
    .rev-lines { width:100%; border-collapse:collapse; }
    .rev-lines th { text-align:left; font-size:.8rem; color:var(--text-secondary,#666); padding:4px 8px; }
    .rev-lines td { padding:4px 8px; border-top:1px solid var(--border,#e5e7eb); vertical-align:middle; }
    .ver-list { display:flex; flex-direction:column; }
    .ver { border-top:1px solid var(--border,#e5e7eb); }
    .ver:first-child { border-top:none; }
    .ver-head { display:flex; align-items:center; gap:.6rem; padding:.6rem 0; cursor:pointer; }
    .ver-total { margin-left:auto; font-weight:600; }
    .ver-delta { font-size:.8rem; }
    .ver-delta--up { color:var(--color-danger,#dc2626); }
    .ver-delta--down { color:var(--color-success,#16a34a); }
    .ver-lines { width:100%; border-collapse:collapse; margin:0 0 .6rem; font-size:.85rem; }
    .ver-lines th, .ver-lines td { padding:4px 8px; text-align:left; }
    .ver-lines th.r, .ver-lines td.r { text-align:right; }
  `],
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

  // Negotiation timeline + record-response
  readonly timeline = signal<QuoteFollowup[]>([]);
  readonly showRecord = signal(false);
  readonly recording = signal(false);
  readonly recordForm = this.fb.nonNullable.group({
    action: 'negotiate',
    rejectReason: 'price',
    counterAmount: [null as number | null],
    message: '',
    nextFollowUpDate: '',
  });
  readonly actionOptions: GwSelectOption[] = [
    { value: 'negotiate', label: 'Negotiating / wants changes' },
    { value: 'accept', label: 'Accepted' },
    { value: 'reject', label: 'Rejected' },
    { value: 'follow_up', label: 'Follow up later' },
  ];
  readonly rejectReasons: GwSelectOption[] = [
    { value: 'price', label: 'Price too high' },
    { value: 'lead_time', label: 'Lead time too long' },
    { value: 'scope', label: 'Scope / specs not right' },
    { value: 'went_elsewhere', label: 'Going with another supplier' },
    { value: 'no_longer_required', label: 'No longer required' },
    { value: 'other', label: 'Other' },
  ];
  copyLink(): void { const l = this.sendResult()?.link; if (l && navigator.clipboard) navigator.clipboard.writeText(l); }
  followupLabel(k: string): string {
    return { sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected', negotiating: 'Negotiating', follow_up: 'Follow-up', note: 'Note', revised: 'Revised' }[k] ?? k;
  }

  // Revise → new version (edit line prices / validity / terms, then re-send)
  readonly showRevise = signal(false);
  readonly revising = signal(false);
  readonly reviseForm = this.fb.nonNullable.group({ validUntil: '', leadTimeDays: [null as number | null], terms: '' });
  readonly reviseLines: FormArray = this.fb.array<FormGroup>([]);

  openRevise(): void {
    const v = this.current();
    this.reviseLines.clear();
    for (const l of v?.lines ?? []) {
      this.reviseLines.push(this.fb.nonNullable.group({
        partName: l.partName,
        primaryQty: [l.primaryQty, [Validators.required, Validators.min(0)]],
        unitPrice: [l.unitPrice, [Validators.required, Validators.min(0)]],
        taxCodeId: l.taxCodeId ?? '',
      }));
    }
    this.reviseForm.reset({ validUntil: v?.validUntil ?? '', leadTimeDays: v?.leadTimeDays ?? null, terms: v?.terms ?? '' });
    this.error.set('');
    this.showRevise.set(true);
  }

  revise(): void {
    if (this.revising() || this.reviseLines.invalid) return;
    this.revising.set(true);
    this.error.set('');
    const h = this.reviseForm.getRawValue();
    const lines = this.reviseLines.controls.map((c) => {
      const l = c.getRawValue();
      return { partName: l.partName, primaryQty: Number(l.primaryQty), unitPrice: Number(l.unitPrice), taxCodeId: l.taxCodeId || undefined };
    });
    this.svc.revise(this.id, {
      validUntil: h.validUntil || undefined,
      leadTimeDays: h.leadTimeDays ?? undefined,
      terms: h.terms || undefined,
      lines,
    }).subscribe({
      next: (q) => { this.revising.set(false); this.showRevise.set(false); this.quote.set(q); this.loadTimeline(); },
      error: (e) => { this.revising.set(false); this.error.set(e?.error?.message ?? 'Failed to revise the quote'); },
    });
  }

  readonly current = computed<QuoteVersion | null>(() => this.quote()?.versions?.find((v) => v.isCurrent) ?? null);

  /** All versions, newest first — the quote's price/terms history across revisions. */
  readonly versions = computed<QuoteVersion[]>(() => [...(this.quote()?.versions ?? [])].sort((a, b) => b.versionNo - a.versionNo));
  readonly expandedVersions = signal<ReadonlySet<number>>(new Set());
  toggleVersion(n: number): void {
    const s = new Set(this.expandedVersions());
    s.has(n) ? s.delete(n) : s.add(n);
    this.expandedVersions.set(s);
  }
  isVersionOpen(n: number): boolean { return this.expandedVersions().has(n); }

  readonly journeyStages = JOURNEY_STAGES;
  /** A forward action is available (open the order, or a draft/sent/accepted/negotiating step). */
  readonly hasActions = computed(() => !!this.quote()?.salesOrder || ['draft', 'sent', 'accepted', 'negotiating'].includes(this.quote()?.status ?? ''));
  /** Plain-language "what to do next" for the guided bar. */
  readonly hint = computed(() => {
    const q = this.quote();
    if (q?.salesOrder) return `Converted to sales order ${q.salesOrder.number} — open it to continue.`;
    switch (q?.status) {
      case 'draft': return 'Send the quote to the customer.';
      case 'sent': return "Awaiting the customer's decision — accept it, then create the sales order.";
      case 'negotiating': return 'Customer is negotiating — revise the prices/terms and re-send a new version.';
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
    this.loadTimeline();
  }

  private loadTimeline(): void {
    this.svc.timeline(this.id).subscribe({ next: (t) => this.timeline.set(t), error: () => { /* timeline is best-effort */ } });
  }

  openRecord(): void {
    this.recordForm.reset({ action: 'negotiate', rejectReason: 'price', counterAmount: null, message: '', nextFollowUpDate: '' });
    this.error.set('');
    this.showRecord.set(true);
  }

  record(): void {
    if (this.recording()) return;
    this.recording.set(true);
    const v = this.recordForm.getRawValue();
    this.svc.respond(this.id, {
      action: v.action as 'accept' | 'reject' | 'negotiate' | 'follow_up' | 'note',
      rejectReason: v.action === 'reject' ? v.rejectReason : undefined,
      counterAmount: v.action === 'negotiate' ? (v.counterAmount ?? undefined) : undefined,
      message: v.message || undefined,
      nextFollowUpDate: (v.action === 'follow_up' || v.action === 'negotiate') ? (v.nextFollowUpDate || undefined) : undefined,
    }).subscribe({
      next: () => {
        this.recording.set(false);
        this.showRecord.set(false);
        this.svc.get(this.id).subscribe((q) => this.quote.set(q));
        this.loadTimeline();
      },
      error: (e) => { this.recording.set(false); this.error.set(e?.error?.message ?? 'Failed to record response'); },
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
