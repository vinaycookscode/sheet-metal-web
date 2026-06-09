import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProcurementService } from '../../core/procurement.service';
import { CatalogService } from '../../core/catalog.service';
import { PurchaseOrder } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

interface LineMeta { id: string; item: string; qty: number; received: number; }

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwInputComponent, GwAlertComponent],
  templateUrl: './po-detail.html',
  styles: [`.recv-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border,#eee)}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(ProcurementService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  private itemMap = new Map<string, string>();
  readonly po = signal<PurchaseOrder | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly lineRows = signal<Array<Record<string, unknown>>>([]);
  readonly grnRows = signal<Array<Record<string, unknown>>>([]);
  readonly lineMeta = signal<LineMeta[]>([]);
  readonly showReceive = signal(false);

  readonly recv = this.fb.array<FormGroup>([]);

  readonly lineCols: GwTableColumn[] = [
    { key: 'item', label: 'Item' },
    { key: 'qty', label: 'Ordered', width: '100px', align: 'right' },
    { key: 'qtyReceived', label: 'Received', width: '100px', align: 'right' },
    { key: 'unitPrice', label: 'Unit ₹', width: '120px', align: 'right' },
  ];
  readonly grnCols: GwTableColumn[] = [
    { key: 'number', label: 'GRN #', width: '170px' },
    { key: 'status', label: 'Status', width: '120px' },
    { key: 'receivedDate', label: 'Received', width: '140px' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ po: this.svc.po(this.id), items: this.catalog.items(), grns: this.svc.grns(this.id) }).subscribe({
      next: ({ po, items, grns }) => {
        this.itemMap = new Map(items.map((i) => [i.id, `${i.code} — ${i.name}`]));
        this.setPo(po);
        this.grnRows.set(grns.map((g) => ({ number: g.number, status: g.status, receivedDate: g.receivedDate })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private setPo(po: PurchaseOrder): void {
    this.po.set(po);
    const lines = po.lines ?? [];
    this.lineRows.set(lines.map((l) => ({ item: this.itemMap.get(l.itemId) ?? l.itemId, qty: l.qty, qtyReceived: l.qtyReceived, unitPrice: l.unitPrice })));
    this.lineMeta.set(lines.map((l) => ({ id: l.id, item: this.itemMap.get(l.itemId) ?? l.itemId, qty: Number(l.qty), received: Number(l.qtyReceived) })));
    this.recv.clear();
    lines.forEach((l) => this.recv.push(this.fb.group({ qtyReceived: [Math.max(0, Number(l.qty) - Number(l.qtyReceived))], heatNo: [''], lotNo: [''] })));
  }

  approve(): void { this.act(() => this.svc.approve(this.id)); }
  send(): void { this.act(() => this.svc.send(this.id)); }

  private act(fn: () => ReturnType<ProcurementService['approve']>): void {
    this.busy.set(true);
    this.error.set('');
    fn().subscribe({
      next: (po) => { this.setPo(po); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Action failed'); },
    });
  }

  receive(): void {
    const lines = this.recv.controls
      .map((c, i) => ({ poLineId: this.lineMeta()[i].id, qtyReceived: Number(c.value.qtyReceived), heatNo: c.value.heatNo || undefined, lotNo: c.value.lotNo || undefined }))
      .filter((l) => l.qtyReceived > 0);
    if (!lines.length) { this.error.set('Enter a received quantity'); return; }
    this.busy.set(true);
    this.error.set('');
    this.svc.createGrn({ purchaseOrderId: this.id, lines }).subscribe({
      next: () => { this.busy.set(false); this.showReceive.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'GRN failed'); },
    });
  }

  statusVariant(s?: string): string {
    return { draft: 'neutral', approved: 'info', sent: 'primary', acknowledged: 'primary', partially_received: 'warning', received: 'success', closed: 'neutral', cancelled: 'danger' }[s ?? ''] ?? 'neutral';
  }
  label(s: string): string { return s.replace(/_/g, ' '); }
}
