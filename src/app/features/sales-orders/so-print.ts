import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesOrdersService, SoDocument } from '../../core/sales-orders.service';
import { Address } from '../../core/finance.service';

@Component({
  selector: 'app-so-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './so-print.html',
  styleUrls: ['../finance/invoice-print.scss'],
  host: { class: 'print-doc' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoPrintPage implements OnInit {
  private readonly svc = inject(SalesOrdersService);
  @Input({ required: true }) id!: string;

  readonly doc = signal<SoDocument | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly intra = computed(() => this.doc()?.so.gstTreatment === 'intra_state');

  ngOnInit(): void {
    this.svc.document(this.id).subscribe({
      next: (d) => { this.doc.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load sales order'); this.loading.set(false); },
    });
  }

  addrLines(a?: Address): string[] {
    if (!a) return [];
    const cityPin = [a.city, a.pincode].filter(Boolean).join(' - ');
    return [a.line1, a.line2, cityPin, a.state].filter(Boolean) as string[];
  }
  label(s?: string): string { return (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
}
