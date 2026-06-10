import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GwCellDirective } from './cell.directive';

export type GwTableAlign = 'left' | 'right' | 'center';
export type GwTableDensity = 'compact' | 'comfortable' | 'spacious';

export interface GwTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: GwTableAlign;
  /** Any valid CSS width — `'120px'`, `'20%'`, `'auto'`, `'minmax(120px, 1fr)'`. */
  width?: string;
  truncate?: boolean;
  cellClass?: string;
  headerClass?: string;
}

export interface GwTableSort {
  key: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'gw-table',
  standalone: true,
  imports: [CommonModule, GwCellDirective],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'gw-table-host',
    '[class.gw-table-host--compact]':    "density === 'compact'",
    '[class.gw-table-host--spacious]':   "density === 'spacious'",
    '[class.gw-table-host--bordered]':   'bordered',
    '[class.gw-table-host--hoverable]':  'hoverable',
    '[class.gw-table-host--sticky-head]': 'stickyHeader',
    '[class.gw-table-host--loading]':    'loading',
  },
})
export class GwTableComponent<T = any> {
  @Input({ required: true }) columns: GwTableColumn[] = [];
  @Input({ required: true })
  get data(): T[] { return this._data(); }
  set data(v: T[]) { this._data.set(v ?? []); this.page.set(0); }
  @Input() loading = false;
  /** Skeleton row count while loading. */
  @Input() skeletonRows = 5;
  @Input() density: GwTableDensity = 'comfortable';
  @Input() bordered = true;
  @Input() hoverable = true;
  @Input() stickyHeader = false;
  /** Field on the row to use as a unique id. */
  @Input() trackBy: string | null = null;
  @Input() emptyText = 'No results';
  /** Client-side: make every column sortable and sort the data in-place. On by default. */
  @Input() autoSort = true;
  /** Client-side pagination page size (0 = off). Defaults to 25. */
  @Input() pageSize = 25;
  /** Current sort state. Sorting is consumer-controlled unless `autoSort`. */
  @Input() set sort(value: GwTableSort | null) { this.sortState.set(value); }
  /** Emits when a sortable header is clicked. Parent sorts and feeds back via `data`. */
  @Output() sortChange = new EventEmitter<GwTableSort | null>();
  /** Emits when a row is clicked. */
  @Output() rowClick = new EventEmitter<T>();

  @ContentChildren(GwCellDirective) cellTemplates?: QueryList<GwCellDirective>;

  private readonly _data = signal<T[]>([]);
  readonly sortState = signal<GwTableSort | null>(null);
  readonly page = signal(0);

  /** Sorted (only when autoSort), full set. */
  readonly sortedRows = computed<T[]>(() => {
    const rows = this._data();
    const s = this.sortState();
    if (!this.autoSort || !s) return rows;
    const dir = s.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => this.compare(this.cellValue(a, s.key), this.cellValue(b, s.key)) * dir);
  });
  readonly total = computed(() => this.sortedRows().length);
  readonly pageCount = computed(() => (this.pageSize ? Math.max(1, Math.ceil(this.total() / this.pageSize)) : 1));
  readonly pageRows = computed<T[]>(() => {
    const rows = this.sortedRows();
    if (!this.pageSize) return rows;
    const start = this.page() * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  });
  readonly rangeStart = computed(() => (this.total() === 0 ? 0 : this.page() * this.pageSize + 1));
  readonly rangeEnd = computed(() => Math.min(this.total(), (this.page() + 1) * this.pageSize));

  private compare(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  isSortable(col: GwTableColumn): boolean { return this.autoSort || !!col.sortable; }

  prev(): void { if (this.page() > 0) this.page.update((p) => p - 1); }
  next(): void { if (this.page() < this.pageCount() - 1) this.page.update((p) => p + 1); }

  cellTemplate(key: string): TemplateRef<any> | null {
    if (!this.cellTemplates) return null;
    return this.cellTemplates.find(t => t.key === key)?.template ?? null;
  }

  trackRow = (index: number, row: T): unknown => {
    if (this.trackBy && row && typeof row === 'object') return (row as any)[this.trackBy];
    return index;
  };

  onHeaderClick(col: GwTableColumn) {
    if (!this.isSortable(col)) return;
    const current = this.sortState();
    let next: GwTableSort | null;
    if (!current || current.key !== col.key)      next = { key: col.key, direction: 'asc' };
    else if (current.direction === 'asc')         next = { key: col.key, direction: 'desc' };
    else                                          next = null;
    this.sortState.set(next);
    this.page.set(0);
    this.sortChange.emit(next);
  }

  sortIndicator(col: GwTableColumn): 'asc' | 'desc' | null {
    if (!this.isSortable(col)) return null;
    const s = this.sortState();
    return s && s.key === col.key ? s.direction : null;
  }

  get skeletonRowsArray(): number[] {
    return Array.from({ length: this.skeletonRows }, (_, i) => i);
  }

  cellValue(row: T, key: string): unknown {
    if (!row || typeof row !== 'object') return '';
    return (row as any)[key];
  }
}
