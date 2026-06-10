import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { AuditService, AuditEntry } from '../../core/audit.service';

interface AuditLine {
  id: string | number;
  actor: string;
  text: string;
  time: string;
  critical: boolean;
}

const VERB: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  status: 'changed the status of',
};
const humanize = (s: string): string => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

@Component({
  selector: 'app-audit-panel',
  standalone: true,
  imports: [],
  templateUrl: './audit-panel.html',
  styleUrl: './audit-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPanelComponent implements OnInit {
  private readonly svc = inject(AuditService);
  @Input({ required: true }) entityType!: string;
  @Input({ required: true }) entityId!: string;

  readonly lines = signal<AuditLine[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void { this.reload(); }

  /** Public so parents can refresh the timeline after an action (no page reload). */
  reload(): void {
    this.svc.list({ entityType: this.entityType, entityId: this.entityId, limit: 100 }).subscribe({
      next: (rows) => { this.lines.set(rows.map((r) => this.toLine(r))); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private entityLabel(): string {
    return this.entityType.replace(/-/g, ' ').replace(/s$/, '');
  }

  private toLine(r: AuditEntry): AuditLine {
    const verb = VERB[r.action] || r.action;
    const status = r.after && typeof r.after === 'object' ? (r.after as Record<string, unknown>)['status'] : undefined;
    const statusClause = typeof status === 'string' && (r.action === 'status' || r.action === 'create') ? ` to ${humanize(status)}` : '';
    const text = `${verb} this ${this.entityLabel()}${statusClause}.`;
    return {
      id: r.id,
      actor: r.actorName || 'System',
      text,
      time: new Date(r.at).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      critical: r.action === 'delete',
    };
  }
}
