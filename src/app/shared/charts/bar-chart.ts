import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartDatum } from './donut-chart';

/** Dependency-free CSS bar chart. */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    @if (data.length) {
      <div class="bars">
        @for (b of data; track b.label) {
          <div class="bar-col">
            <div class="bar-val">{{ b.value }}</div>
            <div class="bar-track">
              <div class="bar" [style.height.%]="pct(b.value)" [style.background]="color"></div>
            </div>
            <div class="bar-label" [title]="b.label">{{ b.label }}</div>
          </div>
        }
      </div>
    } @else {
      <p class="muted">No data</p>
    }
  `,
  styles: [`
    .bars { display: flex; align-items: flex-end; gap: 16px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
    .bar-val { font-size: 13px; font-weight: 600; color: var(--text-primary, #111); }
    .bar-track { height: 150px; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
    .bar { width: 100%; max-width: 52px; min-height: 3px; border-radius: 6px 6px 0 0; transition: height .35s ease; }
    .bar-label { font-size: 12px; color: var(--text-secondary, #666); text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: capitalize; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  @Input() data: ChartDatum[] = [];
  @Input() color = '#2563EB';

  get max(): number { return Math.max(1, ...this.data.map((d) => d.value || 0)); }
  pct(v: number): number { return Math.round(((v || 0) / this.max) * 100); }
}
