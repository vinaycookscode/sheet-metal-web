import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotesService } from '../../core/quotes.service';
import { QuoteDocument } from '../../core/models';

@Component({
  selector: 'app-quote-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quote-print.html',
  styleUrl: '../finance/invoice-print.scss',
  host: { class: 'print-doc' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotePrintPage implements OnInit {
  private readonly svc = inject(QuotesService);
  @Input({ required: true }) id!: string;

  readonly doc = signal<QuoteDocument | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.svc.document(this.id).subscribe({
      next: (d) => { this.doc.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load quote'); this.loading.set(false); },
    });
  }
}
