import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DocumentsService, DocMeta } from '../../core/documents.service';
import { GwButtonComponent } from '../ui/buttons/button/button.component';
import { GwBadgeComponent } from '../ui/display/badge/badge.component';
import { GwAlertComponent } from '../ui/feedback/alert/alert.component';

const KINDS = ['drawing', 'cert_mtr', 'nc_program', 'attachment'];

@Component({
  selector: 'app-documents-panel',
  standalone: true,
  imports: [DatePipe, GwButtonComponent, GwBadgeComponent, GwAlertComponent],
  templateUrl: './documents-panel.html',
  styleUrl: './documents-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsPanelComponent implements OnInit {
  private readonly svc = inject(DocumentsService);
  @Input({ required: true }) entityType!: string;
  @Input({ required: true }) entityId!: string;
  @Input() entityRef?: string;
  @Input() title = 'Documents';

  readonly kinds = KINDS;
  readonly docs = signal<DocMeta[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly kind = signal('drawing');
  readonly file = signal<File | null>(null);
  readonly fileName = signal('');

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.svc.list(this.entityType, this.entityId).subscribe({
      next: (d) => { this.docs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFile(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.file.set(f);
    this.fileName.set(f?.name ?? '');
  }
  setKind(e: Event): void { this.kind.set((e.target as HTMLSelectElement).value); }

  upload(): void {
    const f = this.file();
    if (!f) { this.error.set('Choose a file first'); return; }
    this.busy.set(true);
    this.error.set('');
    this.svc.upload(this.entityType, this.entityId, this.kind(), f, this.entityRef).subscribe({
      next: () => { this.busy.set(false); this.file.set(null); this.fileName.set(''); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Upload failed'); },
    });
  }

  open(d: DocMeta): void {
    this.svc.download(d.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (e) => this.error.set(e?.error?.message ?? 'Download failed'),
    });
  }

  remove(d: DocMeta): void {
    this.busy.set(true);
    this.svc.remove(d.id).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Delete failed'); },
    });
  }

  review(d: DocMeta, status: 'approved' | 'rejected'): void {
    this.busy.set(true);
    this.error.set('');
    this.svc.review(d.id, status).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Review failed'); },
    });
  }

  reviewVariant(s: string): string {
    return { approved: 'success', rejected: 'danger', pending: 'warning' }[s] ?? 'neutral';
  }
  kindLabel(k: string): string { return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
}
