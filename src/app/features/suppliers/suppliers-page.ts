import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CatalogService } from '../../core/catalog.service';
import { Supplier } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [GwCardComponent, GwTableComponent],
  templateUrl: './suppliers-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersPage implements OnInit {
  private readonly svc = inject(CatalogService);

  readonly rows = signal<Supplier[]>([]);
  readonly loading = signal(false);

  readonly columns: GwTableColumn[] = [
    { key: 'code', label: 'Code', width: '130px' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', width: '150px' },
    { key: 'leadTimeDays', label: 'Lead (d)', width: '100px', align: 'right' },
    { key: 'paymentTermsDays', label: 'Terms (d)', width: '100px', align: 'right' },
    { key: 'rating', label: 'Rating', width: '90px', align: 'right' },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    this.svc.suppliers().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
