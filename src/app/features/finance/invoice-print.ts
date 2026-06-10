import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService, InvoiceDocument, Address } from '../../core/finance.service';

@Component({
  selector: 'app-invoice-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-print.html',
  styleUrl: './invoice-print.scss',
  host: { class: 'print-doc' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicePrintPage implements OnInit {
  private readonly svc = inject(FinanceService);
  @Input({ required: true }) id!: string;

  readonly doc = signal<InvoiceDocument | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly intra = computed(() => this.doc()?.invoice.gstTreatment === 'intra_state');

  ngOnInit(): void {
    this.svc.document(this.id).subscribe({
      next: (d) => { this.doc.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load invoice'); this.loading.set(false); },
    });
  }

  addrLines(a?: Address): string[] {
    if (!a) return [];
    const cityPin = [a.city, a.pincode].filter(Boolean).join(' - ');
    return [a.line1, a.line2, cityPin, a.state].filter(Boolean) as string[];
  }
  label(s?: string): string { return (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
}
