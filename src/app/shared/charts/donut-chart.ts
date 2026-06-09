import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface ChartDatum {
  label: string;
  value: number;
}

/** Dependency-free SVG donut chart, styled with the gw design palette. */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  template: `
    @if (total > 0) {
      <div class="donut">
        <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
          <g [attr.transform]="'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'">
            <circle [attr.cx]="size / 2" [attr.cy]="size / 2" [attr.r]="radius"
                    fill="none" stroke="var(--border, #ececec)" [attr.stroke-width]="thickness" />
            @for (s of segments(); track s.label) {
              <circle [attr.cx]="size / 2" [attr.cy]="size / 2" [attr.r]="radius"
                      fill="none" [attr.stroke]="s.color" [attr.stroke-width]="thickness"
                      [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset"
                      stroke-linecap="butt" />
            }
          </g>
          <text [attr.x]="size / 2" [attr.y]="size / 2" text-anchor="middle" dominant-baseline="central" class="donut__total">{{ total }}</text>
        </svg>
        <ul class="donut__legend">
          @for (s of segments(); track s.label) {
            <li><span class="dot" [style.background]="s.color"></span>{{ s.label }} <strong>{{ s.value }}</strong></li>
          }
        </ul>
      </div>
    } @else {
      <p class="muted">No data</p>
    }
  `,
  styles: [`
    .donut { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .donut__total { font-size: 22px; font-weight: 700; fill: var(--text-primary, #111); }
    .donut__legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: 13px; min-width: 160px; }
    .donut__legend li { display: flex; align-items: center; gap: 8px; color: var(--text-secondary, #666); text-transform: capitalize; }
    .donut__legend strong { margin-left: auto; color: var(--text-primary, #111); }
    .donut__legend .dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent {
  @Input() data: ChartDatum[] = [];
  @Input() size = 168;
  @Input() thickness = 24;

  private readonly palette = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#0EA5E9', '#7C3AED', '#64748B', '#DB2777'];

  get total(): number { return this.data.reduce((a, d) => a + (d.value || 0), 0); }
  get radius(): number { return (this.size - this.thickness) / 2; }

  segments() {
    const circ = 2 * Math.PI * this.radius;
    const tot = this.total || 1;
    let acc = 0;
    return this.data
      .filter((d) => d.value > 0)
      .map((d, i) => {
        const len = (d.value / tot) * circ;
        const seg = { label: d.label, value: d.value, color: this.palette[i % this.palette.length], dash: `${len} ${circ - len}`, offset: -acc };
        acc += len;
        return seg;
      });
  }
}
