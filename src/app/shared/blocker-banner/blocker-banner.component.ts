import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlockerService } from '../../core/blocker.service';
import { GwAlertComponent } from '../ui/feedback/alert/alert.component';
import { GwButtonComponent } from '../ui/buttons/button/button.component';

/**
 * App-wide "humane blocker" banner. When a business-rule gate stops an action, the API
 * returns a reason + an optional one-click fix; this renders it at the top of the page
 * (via BlockerService) instead of a raw error toast. Auto-clears when the user navigates.
 */
@Component({
  selector: 'app-blocker-banner',
  standalone: true,
  imports: [RouterLink, GwAlertComponent, GwButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (blocker.current(); as b) {
      <gw-alert
        class="blocker-banner no-print"
        variant="warning"
        title="Can't do that yet"
        [dismissible]="true"
        (dismiss)="blocker.clear()">
        <p class="blocker-banner__msg">{{ b.message }}</p>
        @if (b.action) {
          <div gw-alert-actions>
            @if (b.action.link) {
              <gw-button size="sm" variant="primary" [routerLink]="b.action.link" (click)="blocker.clear()">
                {{ b.action.label }}
              </gw-button>
            } @else {
              <span class="blocker-banner__hint">{{ b.action.label }}</span>
            }
          </div>
        }
      </gw-alert>
    }
  `,
  styles: [`
    .blocker-banner { display: block; margin-bottom: var(--gw-space-4, 1rem); }
    .blocker-banner__msg { margin: 0; }
    .blocker-banner__hint { font-weight: 600; }
  `],
})
export class BlockerBannerComponent {
  readonly blocker = inject(BlockerService);
}
