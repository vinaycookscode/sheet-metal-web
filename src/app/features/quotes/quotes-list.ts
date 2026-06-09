import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { QuotesService } from '../../core/quotes.service';
import { CustomersService } from '../../core/customers.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';

@Component({
  selector: 'app-quotes-list',
  standalone: true,
  imports: [GwCardComponent, GwTableComponent],
  templateUrl: './quotes-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotesListPage implements OnInit {
  private readonly svc = inject(QuotesService);
  private readonly customersSvc = inject(CustomersService);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);

  readonly columns: GwTableColumn[] = [
    { key: 'number', label: 'Quote #', width: '170px' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', width: '120px' },
    { key: 'version', label: 'Ver.', width: '70px', align: 'right' },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({ quotes: this.svc.list(), customers: this.customersSvc.list() }).subscribe({
      next: ({ quotes, customers }) => {
        const byId = new Map(customers.map((c) => [c.id, `${c.code} — ${c.name}`]));
        this.rows.set(quotes.map((q) => ({ id: q.id, number: q.number, customer: byId.get(q.customerId) ?? q.customerId, status: q.status, version: q.currentVersion })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(row: Record<string, unknown>): void {
    this.router.navigate(['/quotes', row['id']]);
  }
}
