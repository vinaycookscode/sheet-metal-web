import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlockerService } from '../../core/blocker.service';
import { GwButtonComponent } from '../ui/buttons/button/button.component';

/**
 * App-wide "humane blocker" banner. When a business-rule gate stops an action, the API
 * returns a reason + an optional one-click fix; this renders it at the top of the page
 * instead of a raw error toast. Auto-clears when the user navigates.
 */
@Component({
  selector: 'app-blocker-banner',
  standalone: true,
  imports: [RouterLink, GwButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (blocker.current(); as b) {
      <div class="blk no-print" role="alert">
        <svg class="blk__icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 9v4"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
          <path d="M12 17h.01"/>
        </svg>
        <div class="blk__text">
          <p class="blk__title">Can’t do that yet</p>
          <p class="blk__msg">{{ b.message }}</p>
        </div>
        @if (b.action?.link) {
          <gw-button class="blk__cta" size="sm" variant="primary" [routerLink]="b.action!.link" (click)="blocker.clear()">
            {{ b.action!.label }}
          </gw-button>
        }
        <button class="blk__close" type="button" aria-label="Dismiss" (click)="blocker.clear()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6 6 18"/>
          </svg>
        </button>
      </div>
    }
  `,
  styles: [`
    .blk {
      display: flex; align-items: center; gap: .85rem;
      margin-bottom: 1rem; padding: .85rem 1rem;
      border: 1px solid var(--color-warning, #f59e0b);
      border-left-width: 4px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, var(--surface, #fff));
      color: var(--text-primary, #111);
    }
    .blk__icon { color: var(--color-warning, #d97706); flex: none; }
    .blk__text { flex: 1; min-width: 0; }
    .blk__title { margin: 0; font-weight: 700; font-size: .9rem; }
    .blk__msg { margin: .1rem 0 0; font-size: .88rem; color: var(--text-secondary, #444); }
    .blk__cta { flex: none; }
    .blk__close {
      flex: none; display: grid; place-items: center;
      width: 28px; height: 28px; border: none; border-radius: 6px;
      background: transparent; color: var(--text-secondary, #666); cursor: pointer;
    }
    .blk__close:hover { background: color-mix(in srgb, var(--color-warning, #f59e0b) 18%, transparent); }
  `],
})
export class BlockerBannerComponent {
  readonly blocker = inject(BlockerService);
}
