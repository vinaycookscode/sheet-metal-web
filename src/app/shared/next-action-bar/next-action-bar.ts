import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GwCardComponent } from '../ui/display/card/card.component';
import { LifecycleStepperComponent } from '../lifecycle-stepper/lifecycle-stepper';

/**
 * Guided "what's next" header for a record. Shows where this record sits in the
 * overall journey (Inquiry → Quote → Sales Order → Production → Dispatch) and
 * elevates the single best next step instead of a row of equal-weight buttons.
 *
 *   <app-next-action-bar [stages]="journeyStages" [current]="1" [hint]="hint()" [hasActions]="...">
 *     <gw-button primary-action variant="primary" ...>Create sales order</gw-button>
 *     <gw-button secondary-actions variant="ghost" ...>Reject</gw-button>
 *   </app-next-action-bar>
 */
@Component({
  selector: 'app-next-action-bar',
  standalone: true,
  imports: [GwCardComponent, LifecycleStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <gw-card padding="lg" class="nab mb-4">
      <app-lifecycle-stepper [stages]="stages" [current]="current" [next]="hint" />
      <!-- ng-content is kept OUT of @if (conditional content projection is unreliable);
           the row is just hidden when there are no actions. -->
      <div class="nab__bar" [class.nab__bar--hidden]="!hasActions">
        <div class="nab__primary"><ng-content select="[primary-action]"></ng-content></div>
        <div class="nab__secondary"><ng-content select="[secondary-actions]"></ng-content></div>
      </div>
    </gw-card>
  `,
  styles: [`
    .nab__bar { display: flex; align-items: center; gap: .75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .nab__bar--hidden { display: none; }
    .nab__primary { display: flex; gap: .5rem; flex-wrap: wrap; }
    .nab__secondary { display: flex; gap: .5rem; flex-wrap: wrap; margin-left: auto; }
  `],
})
export class NextActionBarComponent {
  @Input({ required: true }) stages: string[] = [];
  @Input() current = 0;
  @Input() hint?: string;
  /** When false, only the journey/stepper shows (terminal states with no next step). */
  @Input() hasActions = true;
}
