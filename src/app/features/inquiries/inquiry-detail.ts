import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InquiriesService } from '../../core/inquiries.service';
import { QuotesService } from '../../core/quotes.service';
import { AuthService } from '../../core/auth.service';
import { Inquiry } from '../../core/models';
import { Observable } from 'rxjs';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [RouterLink, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwAlertComponent],
  templateUrl: './inquiry-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(InquiriesService);
  private readonly quotesSvc = inject(QuotesService);
  private readonly auth = inject(AuthService);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly inquiry = signal<Inquiry | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly columns: GwTableColumn[] = [
    { key: 'lineNo', label: '#', width: '60px' },
    { key: 'partName', label: 'Part' },
    { key: 'qty', label: 'Qty', width: '110px', align: 'right' },
    { key: 'targetPrice', label: 'Target ₹', width: '130px', align: 'right' },
  ];

  ngOnInit(): void {
    this.svc.get(this.id).subscribe({
      next: (i) => { this.inquiry.set(i); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  send(): void { this.act(this.svc.sendToEstimation(this.id, this.auth.user()!.id)); }
  won(): void { this.act(this.svc.outcome(this.id, 'won')); }
  lost(): void { this.act(this.svc.outcome(this.id, 'lost', 'Lost to competitor')); }

  createQuote(): void {
    this.busy.set(true);
    this.error.set('');
    this.quotesSvc.createFromInquiry(this.id).subscribe({
      next: (q) => this.router.navigate(['/quotes', q.id]),
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Failed to create quote'); },
    });
  }

  private act(obs: Observable<Inquiry>): void {
    this.busy.set(true);
    this.error.set('');
    obs.subscribe({
      next: (i) => { this.inquiry.set(i); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Action failed'); },
    });
  }

  statusVariant(s?: string): string {
    return { new: 'info', estimating: 'warning', quoted: 'primary', won: 'success', lost: 'danger', cancelled: 'neutral' }[s ?? ''] ?? 'neutral';
  }
  canChange(s?: string): boolean {
    return s === 'new' || s === 'estimating' || s === 'quoted';
  }
}
