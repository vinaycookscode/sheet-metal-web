import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProductionService, BoardGroup } from '../../core/production.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-production-board',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwInputComponent, GwAlertComponent],
  templateUrl: './production-board.html',
  styles: [`
    .op-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border,#eee)}
    .op-row:last-child{border-bottom:none}
    .clockoff{display:grid;grid-template-columns:1fr 1fr 2fr auto auto;gap:8px;align-items:center;padding:10px;background:var(--surface-input,#f4f4f5);border-radius:8px;margin:6px 0}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductionBoardPage implements OnInit {
  private readonly svc = inject(ProductionService);
  private readonly fb = inject(FormBuilder);

  readonly groups = signal<BoardGroup[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly clockOffOpId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({ qtyGood: [0], qtyScrap: [0], scrapReason: [''] });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.board().subscribe({
      next: (g) => { this.groups.set(g); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  clockOn(opId: string): void {
    this.error.set('');
    this.svc.clockOn(opId).subscribe({ next: () => this.load(), error: (e) => this.error.set(e?.error?.message ?? 'Clock-on failed') });
  }

  startClockOff(opId: string): void {
    this.clockOffOpId.set(opId);
    this.form.reset({ qtyGood: 0, qtyScrap: 0, scrapReason: '' });
  }

  confirmClockOff(): void {
    const opId = this.clockOffOpId();
    if (!opId) return;
    this.busy.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.svc.clockOff({ woOperationId: opId, qtyGood: v.qtyGood, qtyScrap: v.qtyScrap, scrapReason: v.scrapReason || undefined }).subscribe({
      next: () => { this.busy.set(false); this.clockOffOpId.set(null); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Clock-off failed'); },
    });
  }

  opVariant(s: string): string {
    return { queued: 'neutral', in_progress: 'warning', completed: 'success', skipped: 'neutral' }[s] ?? 'neutral';
  }
}
