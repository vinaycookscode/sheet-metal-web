import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService, AdminRole } from '../../core/admin.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';

interface PermGroup { name: string; codes: string[]; }

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwAlertComponent, GwDrawerComponent],
  templateUrl: './roles-page.html',
  styles: [`.grp{margin-bottom:14px}.grp__h{font-size:12px;font-weight:600;text-transform:capitalize;margin-bottom:6px;color:var(--text-secondary)}.checks{display:flex;flex-wrap:wrap;gap:8px 16px}.chk{display:flex;align-items:center;gap:6px;font-size:12px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRolesPage implements OnInit {
  private readonly svc = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly groups = signal<PermGroup[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showCreate = signal(false);

  readonly edit = signal<AdminRole | null>(null);
  readonly selected = signal<Set<string>>(new Set());

  readonly columns: GwTableColumn[] = [
    { key: 'code', label: 'Code', width: '180px' },
    { key: 'name', label: 'Name' },
    { key: 'count', label: 'Permissions', width: '130px', align: 'right' },
  ];
  readonly createForm = this.fb.nonNullable.group({ code: ['', Validators.required], name: ['', Validators.required] });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    forkJoin({ roles: this.svc.roles(), perms: this.svc.permissions() }).subscribe({
      next: ({ roles, perms }) => {
        this.groups.set(this.groupBy(perms));
        this.rows.set(roles.map((r) => ({ id: r.id, code: r.code, name: r.name, count: r.permissions.length, _r: r })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private groupBy(codes: string[]): PermGroup[] {
    const map = new Map<string, string[]>();
    for (const c of codes) {
      const g = c.split('.')[0];
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    }
    return [...map.entries()].map(([name, codes]) => ({ name, codes }));
  }

  create(): void {
    if (this.createForm.invalid) return;
    this.busy.set(true); this.error.set('');
    this.svc.createRole(this.createForm.getRawValue()).subscribe({
      next: () => { this.busy.set(false); this.showCreate.set(false); this.createForm.reset(); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Create failed'); },
    });
  }

  open(row: Record<string, unknown>): void {
    const r = row['_r'] as AdminRole;
    this.edit.set(r);
    this.selected.set(new Set(r.permissions));
    this.error.set('');
  }
  toggle(code: string, on: boolean): void {
    const s = new Set(this.selected()); on ? s.add(code) : s.delete(code); this.selected.set(s);
  }
  has(code: string): boolean { return this.selected().has(code); }
  toggleGroup(g: PermGroup, on: boolean): void {
    const s = new Set(this.selected());
    for (const c of g.codes) { on ? s.add(c) : s.delete(c); }
    this.selected.set(s);
  }

  savePerms(): void {
    const r = this.edit(); if (!r) return;
    this.busy.set(true); this.error.set('');
    this.svc.setRolePermissions(r.id, [...this.selected()]).subscribe({
      next: () => { this.busy.set(false); this.edit.set(null); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Save failed'); },
    });
  }
}
