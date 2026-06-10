import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { AuditService, AuditEntry } from '../../core/audit.service';
import { GwAuditRowComponent, GwAuditEvent } from '../ui/enterprise/audit-row/audit-row.component';

const ACTION_LABEL: Record<string, string> = {
  create: 'created', update: 'updated', delete: 'deleted', status: 'changed status',
};

@Component({
  selector: 'app-audit-panel',
  standalone: true,
  imports: [GwAuditRowComponent],
  templateUrl: './audit-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPanelComponent implements OnInit {
  private readonly svc = inject(AuditService);
  @Input({ required: true }) entityType!: string;
  @Input({ required: true }) entityId!: string;

  readonly events = signal<GwAuditEvent[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.svc.list({ entityType: this.entityType, entityId: this.entityId, limit: 100 }).subscribe({
      next: (rows) => { this.events.set(rows.map((r) => this.toEvent(r))); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private toEvent(r: AuditEntry): GwAuditEvent {
    const status = (r.after && typeof r.after === 'object' ? (r.after as Record<string, unknown>)['status'] : undefined) as string | undefined;
    return {
      id: r.id,
      actor: r.actorName || 'System',
      action: ACTION_LABEL[r.action] || r.action,
      resource: this.entityType.replace(/-/g, ' ').replace(/s$/, ''),
      status,
      time: new Date(r.at).toLocaleString(),
      severity: r.action === 'delete' ? 'warning' : 'info',
    };
  }
}
