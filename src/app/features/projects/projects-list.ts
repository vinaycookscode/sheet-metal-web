import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProjectsService } from '../../core/projects.service';
import { CustomersService } from '../../core/customers.service';
import { Project } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwDateInputComponent } from '../../shared/ui/forms/date-input/date-input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwTableComponent,
    GwFormFieldComponent, GwInputComponent, GwDateInputComponent, GwSelectComponent, GwAlertComponent,
  ],
  templateUrl: './projects-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListPage implements OnInit {
  private readonly svc = inject(ProjectsService);
  private readonly customersSvc = inject(CustomersService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly rows = signal<Array<Project & { customer: string }>>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly customerOptions = signal<GwSelectOption[]>([]);

  readonly columns: GwTableColumn[] = [
    { key: 'code', label: 'Code', width: '150px' },
    { key: 'name', label: 'Project' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', width: '120px' },
  ];

  readonly form = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    name: ['', Validators.required],
    targetDate: [''],
    description: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ projects: this.svc.list(), customers: this.customersSvc.list() }).subscribe({
      next: ({ projects, customers }) => {
        const byId = new Map(customers.map((c) => [c.id, `${c.code} — ${c.name}`]));
        this.customerOptions.set(customers.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })));
        this.rows.set(projects.map((p) => ({ ...p, customer: byId.get(p.customerId) ?? p.customerId })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    this.error.set('');
  }

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.svc.create({ customerId: v.customerId, name: v.name, targetDate: v.targetDate || undefined, description: v.description || undefined }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset({ customerId: '', name: '', targetDate: '', description: '' });
        this.load();
      },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to save project'); },
    });
  }

  open(row: Project): void {
    this.router.navigate(['/projects', row.id]);
  }
}
