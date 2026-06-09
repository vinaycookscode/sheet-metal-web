import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SalesOrdersService } from '../../core/sales-orders.service';
import { CustomersService } from '../../core/customers.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';

@Component({
  selector: 'app-so-list',
  standalone: true,
  imports: [GwCardComponent, GwTableComponent],
  templateUrl: './so-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoListPage implements OnInit {
  private readonly svc = inject(SalesOrdersService);
  private readonly customersSvc = inject(CustomersService);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'SO #', width: '170px' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', width: '140px' },
    { key: 'orderDate', label: 'Order date', width: '130px' },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({ orders: this.svc.list(), customers: this.customersSvc.list() }).subscribe({
      next: ({ orders, customers }) => {
        const byId = new Map(customers.map((c) => [c.id, `${c.code} — ${c.name}`]));
        this.rows.set(orders.map((o) => ({ id: o.id, number: o.number, customer: byId.get(o.customerId) ?? o.customerId, status: o.status, orderDate: o.orderDate })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(row: Record<string, unknown>): void {
    this.router.navigate(['/sales-orders', row['id']]);
  }
}
