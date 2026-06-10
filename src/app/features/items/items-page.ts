import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CatalogService } from '../../core/catalog.service';
import { Item } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';
import { LabelPrintComponent, LabelItem } from '../../shared/label-print/label-print';

@Component({
  selector: 'app-items-page',
  standalone: true,
  imports: [GwCardComponent, GwButtonComponent, GwTableComponent, GwDrawerComponent, LabelPrintComponent],
  templateUrl: './items-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsPage implements OnInit {
  private readonly svc = inject(CatalogService);

  readonly rows = signal<Item[]>([]);
  readonly loading = signal(false);
  readonly showLabels = signal(false);
  readonly labels = computed<LabelItem[]>(() =>
    this.rows().map((i) => ({ code: `item:${i.code}`, title: i.code, lines: [i.name] })),
  );
  printLabels(): void { window.print(); }

  readonly columns: GwTableColumn[] = [
    { key: 'code', label: 'Code', width: '160px' },
    { key: 'name', label: 'Name' },
    { key: 'itemType', label: 'Type', width: '150px' },
    { key: 'isTraceable', label: 'Traceable', width: '110px', align: 'center' },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    this.svc.items().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
