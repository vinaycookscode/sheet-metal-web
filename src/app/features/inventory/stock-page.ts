import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { InventoryService } from '../../core/inventory.service';
import { CatalogService } from '../../core/catalog.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';
import { LabelPrintComponent, LabelItem } from '../../shared/label-print/label-print';

@Component({
  selector: 'app-stock-page',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwInputComponent, GwAlertComponent, GwDrawerComponent, LabelPrintComponent],
  templateUrl: './stock-page.html',
  styles: [`
    .lot-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border,#eee)}
    .lot-row:last-child{border-bottom:none}
    .adjust{display:grid;grid-template-columns:1fr 2fr auto auto;gap:8px;align-items:center;padding:10px;background:var(--surface-input,#f4f4f5);border-radius:8px;margin:6px 0}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockPage implements OnInit {
  private readonly inv = inject(InventoryService);
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  private itemMap = new Map<string, string>();
  readonly summaryRows = signal<Array<Record<string, unknown>>>([]);
  readonly lots = signal<Array<Record<string, unknown>>>([]);
  readonly fgRows = signal<Array<Record<string, unknown>>>([]);
  readonly ledgerRows = signal<Array<Record<string, unknown>>>([]);

  readonly fgCols: GwTableColumn[] = [
    { key: 'part', label: 'Part' },
    { key: 'salesOrder', label: 'Sales order', width: '170px' },
    { key: 'qty', label: 'Made', width: '90px', align: 'right' },
    { key: 'shipped', label: 'Shipped', width: '90px', align: 'right' },
    { key: 'available', label: 'On hand', width: '90px', align: 'right' },
    { key: 'location', label: 'Location', width: '120px' },
  ];
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly adjustLotId = signal<string | null>(null);
  readonly showLabels = signal(false);
  readonly lotLabels = computed<LabelItem[]>(() =>
    this.lots().map((l) => ({ code: `lot:${l['id']}`, title: String(l['item']), lines: [`Lot: ${l['lotNo']}`, `On hand: ${l['onHand']}`] })),
  );
  printLabels(): void { window.print(); }

  readonly form = this.fb.nonNullable.group({ qtyDelta: [0], reason: [''] });

  readonly summaryCols: GwTableColumn[] = [
    { key: 'code', label: 'Item', width: '180px' },
    { key: 'name', label: 'Name' },
    { key: 'onHand', label: 'On hand', width: '110px', align: 'right' },
    { key: 'allocated', label: 'Allocated', width: '110px', align: 'right' },
    { key: 'available', label: 'Available', width: '110px', align: 'right' },
  ];
  readonly ledgerCols: GwTableColumn[] = [
    { key: 'type', label: 'Type', width: '150px' },
    { key: 'item', label: 'Item' },
    { key: 'delta', label: 'Qty Δ', width: '110px', align: 'right' },
    { key: 'reference', label: 'Reference' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({ summary: this.catalog.stockSummary(), lots: this.inv.list(), fg: this.inv.finishedGoods(), ledger: this.inv.ledger(), items: this.catalog.items() }).subscribe({
      next: ({ summary, lots, fg, ledger, items }) => {
        this.itemMap = new Map(items.map((i) => [i.id, `${i.code} — ${i.name}`]));
        this.summaryRows.set(summary.map((s) => ({ code: s.code, name: s.name, onHand: s.onHand, allocated: s.allocated, available: s.available })));
        this.lots.set(lots.map((l) => ({ id: l.id, item: this.itemMap.get(l.itemId) ?? l.itemId, lotNo: l.lotNo ?? '—', location: l.location ?? '—', onHand: l.qtyOnHand, allocated: l.qtyAllocated, isRemnant: l.isRemnant, qcStatus: l.qcStatus ?? 'accepted' })));
        this.fgRows.set(fg.map((f) => ({ part: `${f.partNo}-${f.rev}`, salesOrder: f.salesOrder ?? '—', qty: f.qty, shipped: f.qtyShipped, available: f.available, location: f.location ?? '—' })));
        this.ledgerRows.set(ledger.slice(0, 50).map((t) => ({ type: t.txn_type, item: this.itemMap.get(t.item_id) ?? t.item_id, delta: t.qty_delta, reference: t.reference ?? '—' })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startAdjust(lotId: string): void { this.adjustLotId.set(lotId); this.form.reset({ qtyDelta: 0, reason: '' }); this.error.set(''); }

  setQc(lotId: string, decision: 'accepted' | 'rejected' | 'hold'): void {
    this.busy.set(true);
    this.error.set('');
    this.inv.lotQc(lotId, decision).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'QC update failed'); },
    });
  }
  qcVariant(s?: string): string {
    return { accepted: 'success', rejected: 'danger', hold: 'warning' }[s ?? 'accepted'] ?? 'neutral';
  }

  confirmAdjust(): void {
    const lotId = this.adjustLotId();
    if (!lotId) return;
    const v = this.form.getRawValue();
    if (!v.reason) { this.error.set('Reason is required'); return; }
    this.busy.set(true);
    this.error.set('');
    this.inv.adjust({ stockLotId: lotId, qtyDelta: Number(v.qtyDelta), reason: v.reason }).subscribe({
      next: () => { this.busy.set(false); this.adjustLotId.set(null); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Adjust failed'); },
    });
  }
}
