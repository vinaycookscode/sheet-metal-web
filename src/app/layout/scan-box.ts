import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GwIconButtonComponent } from '../shared/ui/buttons/icon-button/icon-button.component';

// token prefix -> destination route resolver
const ROUTES: Record<string, (v: string) => string> = {
  wo: (v) => `/work-orders/${v}`,
  lot: () => `/stock`,
  item: () => `/items`,
  inquiry: (v) => `/inquiries/${v}`,
  so: (v) => `/sales-orders/${v}`,
  po: (v) => `/purchase-orders/${v}`,
  inv: (v) => `/invoices/${v}`,
  dc: (v) => `/shipments/${v}`,
};

@Component({
  selector: 'app-scan-box',
  standalone: true,
  imports: [GwIconButtonComponent],
  templateUrl: './scan-box.html',
  styleUrl: './scan-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanBoxComponent {
  private readonly router = inject(Router);
  @ViewChild('inp') inp?: ElementRef<HTMLInputElement>;

  readonly open = signal(false);
  readonly value = signal('');
  readonly error = signal('');

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    this.error.set('');
    if (next) setTimeout(() => this.inp?.nativeElement.focus(), 0);
  }

  submit(): void {
    const raw = this.value().trim();
    if (!raw) return;
    const m = raw.match(/^(\w+)\s*:\s*(.+)$/);
    const type = (m ? m[1] : '').toLowerCase();
    const val = m ? m[2].trim() : raw;
    const resolve = ROUTES[type];
    if (!resolve) {
      this.error.set(`Unrecognized code: "${raw}"`);
      return;
    }
    this.open.set(false);
    this.value.set('');
    this.error.set('');
    this.router.navigateByUrl(resolve(val));
  }
}
