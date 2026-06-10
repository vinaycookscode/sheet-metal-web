import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService, AdminRole, AdminUser } from '../../core/admin.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwAlertComponent, GwDrawerComponent],
  templateUrl: './users-page.html',
  styles: [`.checks{display:flex;flex-wrap:wrap;gap:10px 18px}.chk{display:flex;align-items:center;gap:6px;font-size:13px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPage implements OnInit {
  private readonly svc = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly roles = signal<AdminRole[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showCreate = signal(false);
  readonly createRoleIds = signal<Set<string>>(new Set());

  readonly edit = signal<AdminUser | null>(null);
  readonly editRoleIds = signal<Set<string>>(new Set());
  readonly editActive = signal(true);
  readonly newPassword = signal('');

  readonly columns: GwTableColumn[] = [
    { key: 'email', label: 'Email' },
    { key: 'fullName', label: 'Name' },
    { key: 'roles', label: 'Roles' },
    { key: 'status', label: 'Status', width: '110px' },
  ];

  readonly createForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    forkJoin({ users: this.svc.users(), roles: this.svc.roles() }).subscribe({
      next: ({ users, roles }) => {
        this.roles.set(roles);
        this.rows.set(users.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName, roles: u.roles.join(', ') || '—', status: u.isActive ? 'Active' : 'Inactive', _u: u })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleCreateRole(id: string, on: boolean): void {
    const s = new Set(this.createRoleIds()); on ? s.add(id) : s.delete(id); this.createRoleIds.set(s);
  }
  create(): void {
    if (this.createForm.invalid) return;
    this.busy.set(true); this.error.set('');
    this.svc.createUser({ ...this.createForm.getRawValue(), roleIds: [...this.createRoleIds()] }).subscribe({
      next: () => { this.busy.set(false); this.showCreate.set(false); this.createForm.reset(); this.createRoleIds.set(new Set()); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Create failed'); },
    });
  }

  open(row: Record<string, unknown>): void {
    const u = row['_u'] as AdminUser;
    this.edit.set(u);
    this.editRoleIds.set(new Set(this.roles().filter((r) => u.roles.includes(r.code)).map((r) => r.id)));
    this.editActive.set(u.isActive);
    this.newPassword.set('');
    this.error.set('');
  }
  toggleEditRole(id: string, on: boolean): void {
    const s = new Set(this.editRoleIds()); on ? s.add(id) : s.delete(id); this.editRoleIds.set(s);
  }
  saveEdit(): void {
    const u = this.edit(); if (!u) return;
    this.busy.set(true); this.error.set('');
    forkJoin({
      a: this.svc.updateUser(u.id, { isActive: this.editActive() }),
      b: this.svc.setUserRoles(u.id, [...this.editRoleIds()]),
    }).subscribe({
      next: () => { this.busy.set(false); this.edit.set(null); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Save failed'); },
    });
  }
  resetPw(): void {
    const u = this.edit(); if (!u || this.newPassword().length < 6) { this.error.set('Password must be at least 6 characters'); return; }
    this.busy.set(true); this.error.set('');
    this.svc.resetPassword(u.id, this.newPassword()).subscribe({
      next: () => { this.busy.set(false); this.newPassword.set(''); this.error.set(''); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Reset failed'); },
    });
  }

  has(set: Set<string>, id: string): boolean { return set.has(id); }
}
