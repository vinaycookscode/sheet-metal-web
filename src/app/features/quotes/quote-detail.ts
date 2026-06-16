import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { QuotesService } from '../../core/quotes.service';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { Quote, QuoteVersion } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { NextActionBarComponent } from '../../shared/next-action-bar/next-action-bar';
import { JOURNEY_STAGES } from '../../shared/next-action-bar/journey';

@Component({
  selector: 'app-quote-detail',
  standalone: true,
  imports: [RouterLink, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwAlertComponent, NextActionBarComponent],
  templateUrl: './quote-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(QuotesService);
  private readonly soSvc = inject(SalesOrdersService);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly quote = signal<Quote | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly current = computed<QuoteVersion | null>(() => this.quote()?.versions?.find((v) => v.isCurrent) ?? null);

  readonly journeyStages = JOURNEY_STAGES;
  /** True while the quote still has a forward action (draft/sent/accepted). */
  readonly hasActions = computed(() => ['draft', 'sent', 'accepted'].includes(this.quote()?.status ?? ''));
  /** Plain-language "what to do next" for the guided bar, by quote status. */
  readonly hint = computed(() => {
    switch (this.quote()?.status) {
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
