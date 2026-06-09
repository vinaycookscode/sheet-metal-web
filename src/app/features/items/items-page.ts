import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CatalogService } from '../../core/catalog.service';
import { Item } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';

@Component({
  selector: 'app-items-page',
  standalone: true,
  imports: [GwCardComponent, GwTableComponent],
  templateUrl: './items-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsPage implements OnInit {
  private readonly svc = inject(CatalogService);

  readonly rows = signal<Item[]>([]);
  readonly loading = signal(false);

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
