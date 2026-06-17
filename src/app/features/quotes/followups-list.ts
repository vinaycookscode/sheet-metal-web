import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuotesService } from '../../core/quotes.service';
import { QuoteFollowupRow } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';

@Component({
  selector: 'app-followups-list',
  standalone: true,
  imports: [CommonModule, GwCardComponent, GwBadgeComponent],
  templateUrl: './followups-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .fu-list { display:flex; flex-direction:column; gap:.75rem; }
    .fu-card { cursor:pointer; }
    .fu-top { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
    .fu-left { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }
    .fu-resp { margin:.4rem 0 0; }
    .fu-resp--customer { font-weight:600; }
    .fu-meta { color:var(--text-secondary,#666); font-size:.85rem; }
    .fu-due { color:var(--color-warning,#b45309); font-weight:600; }
  `],
})
export class FollowupsListPage implements OnInit {
  private readonly svc = inject(QuotesService);
  private readonly router = inject(Router);

  readonly rows = signal<QuoteFollowupRow[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.svc.followups().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  open(id: string): void { this.router.navigate(['/quotes', id]); }

  statusVariant(s: string): string {
    return { sent: 'info', negotiating: 'warning' }[s] ?? 'neutral';
  }

  /** One-line summary of the latest activity for the row. */
  responseSummary(r: QuoteFollowupRow): string {
    const f = r.lastResponse;
    if (f && f.source === 'customer') {
      if (f.kind === 'negotiating') return f.counterAmount ? `Customer proposed ₹${f.counterAmount.toLocaleString('en-IN')}` : 'Customer wants changes';
      if (f.kind === 'rejected') return 'Customer declined';
      if (f.kind === 'accepted') return 'Customer accepted';
    }
    if (r.status === 'negotiating') return 'In negotiation';
    return 'Awaiting customer response';
  }

  isOverdue(r: QuoteFollowupRow): boolean {
    return !!r.nextFollowUpDate && r.nextFollowUpDate <= new Date().toISOString().slice(0, 10);
  }
}
