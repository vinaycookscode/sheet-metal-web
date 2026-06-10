import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchService, CertificateDocument } from '../../core/dispatch.service';
import { Address } from '../../core/finance.service';

@Component({
  selector: 'app-certificate-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate-print.html',
  styleUrls: ['../finance/invoice-print.scss'],
  host: { class: 'print-doc' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificatePrintPage implements OnInit {
  private readonly svc = inject(DispatchService);
  @Input({ required: true }) id!: string;

  readonly doc = signal<CertificateDocument | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.svc.certificate(this.id).subscribe({
      next: (d) => { this.doc.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load certificate'); this.loading.set(false); },
    });
  }

  addrLines(a?: Address): string[] {
    if (!a) return [];
    const cityPin = [a.city, a.pincode].filter(Boolean).join(' - ');
    return [a.line1, a.line2, cityPin, a.state].filter(Boolean) as string[];
  }
  label(s?: string): string { return (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
}
