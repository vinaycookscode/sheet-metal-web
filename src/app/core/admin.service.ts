import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  defaultPlantId?: string | null;
  roles: string[];
}
export interface AdminRole {
  id: string;
  code: string;
  name: string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  users() { return this.http.get<AdminUser[]>(`${this.base}/users`); }
  createUser(body: { email: string; fullName: string; password: string; roleIds: string[] }) {
    return this.http.post<{ id: string }>(`${this.base}/users`, body);
  }
  updateUser(id: string, body: { fullName?: string; isActive?: boolean }) {
    return this.http.patch(`${this.base}/users/${id}`, body);
  }
  setUserRoles(id: string, roleIds: string[]) {
    return this.http.put(`${this.base}/users/${id}/roles`, { roleIds });
  }
  resetPassword(id: string, password: string) {
    return this.http.post(`${this.base}/users/${id}/reset-password`, { password });
  }

  roles() { return this.http.get<AdminRole[]>(`${this.base}/roles`); }
  createRole(body: { code: string; name: string }) {
    return this.http.post<{ id: string }>(`${this.base}/roles`, body);
  }
  setRolePermissions(id: string, permissions: string[]) {
    return this.http.put(`${this.base}/roles/${id}/permissions`, { permissions });
  }

  permissions() { return this.http.get<string[]>(`${this.base}/permissions`); }
}
