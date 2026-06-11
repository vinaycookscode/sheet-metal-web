import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Compact "you are here" progress bar for a record's lifecycle.
 * Pass the ordered stage labels, the current index, and an optional next-step hint.
 */
@Component({
  selector: 'app-lifecycle-stepper',
  standalone: true,
  template: `
    <div class="lcs">
      @for (s of stages; track s; let i = $index; let last = $last) {
        <div class="lcs__step" [class.is-done]="i < current" [class.is-cur]="i === current">
          <span class="lcs__dot">{{ i < current ? '✓' : (i + 1) }}</span>
          <span class="lcs__label">{{ s }}</span>
        </div>
        @if (!last) { <span class="lcs__bar" [class.is-done]="i < current"></span> }
      }
    </div>
    @if (next && current >= 0) { <div class="lcs__next"><strong>Next:</strong> {{ next }}</div> }
  `,
  styles: [`
    .lcs{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:4px 0}
    .lcs__step{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:8px}
    .lcs__dot{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:var(--surface-input);color:var(--text-secondary);flex:none}
    .lcs__label{font-size:13px;color:var(--text-secondary);white-space:nowrap}
    .lcs__step.is-done .lcs__dot{background:var(--color-success,#16a34a);color:#fff}
    .lcs__step.is-done .lcs__label{color:var(--text-primary)}
    .lcs__step.is-cur .lcs__dot{background:linear-gradient(135deg,var(--color-primary),var(--color-purple,#8b5cf6));color:#fff}
    .lcs__step.is-cur .lcs__label{color:var(--text-primary);font-weight:600}
    .lcs__bar{width:18px;height:2px;background:var(--border);flex:none}
    .lcs__bar.is-done{background:var(--color-success,#16a34a)}
    .lcs__next{font-size:13px;color:var(--text-secondary);margin-top:6px}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LifecycleStepperComponent {
  @Input({ required: true }) stages: string[] = [];
  @Input() current = 0;
  @Input() next?: string;
}
