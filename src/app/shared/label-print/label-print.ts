import { ChangeDetectionStrategy, Component, Input, OnChanges, signal } from '@angular/core';
import QRCode from 'qrcode';
import { scanUrl } from '../scan-routes';

export interface LabelItem {
  /** Encoded value (e.g. "wo:<id>", "lot:<id>", "item:<code>"). */
  code: string;
  title: string;
  lines?: string[];
}
interface Rendered extends LabelItem {
  qr: string;
}

@Component({
  selector: 'app-label-print',
  standalone: true,
  templateUrl: './label-print.html',
  styleUrl: './label-print.scss',
  host: { class: 'print-doc' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelPrintComponent implements OnChanges {
  @Input() labels: LabelItem[] = [];
  readonly rendered = signal<Rendered[]>([]);

  async ngOnChanges(): Promise<void> {
    const out: Rendered[] = [];
    for (const l of this.labels) {
      // Encode a full app URL so any phone scanner opens the record (not an opaque token).
      const qr = await QRCode.toDataURL(scanUrl(l.code), { margin: 1, width: 240, errorCorrectionLevel: 'M' });
      out.push({ ...l, qr });
    }
    this.rendered.set(out);
  }
}
