import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse } from './models';

const TOKEN_KEY = 'sm_access_token';
const USER_KEY = 'sm_user';

/** A coarse "who is this" grouping derived from role codes — drives the default landing and nav. */
export type Persona = 'admin' | 'commercial' | 'planning' | 'shopfloor' | 'quality' | 'finance' | 'general';

const ROLE_TO_PERSONA: Record<string, Persona> = {
  admin: 'admin',
  sales: 'commercial',
  estimator: 'commercial',
  planner: 'planning',
  operator: 'shopfloor',
  supervisor: 'shopfloor',
  qa: 'quality',
  finance: 'finance',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _user = signal<AuthUser | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly roles = computed(() => this._user()?.roles ?? []);
  readonly isAdmin = computed(() => this.roles().includes('admin'));

  /** Primary persona: admin wins, else the first role with a known mapping, else 'general'. */
  readonly persona = computed<Persona>(() => {
    const roles = this.roles();
    if (roles.includes('admin')) return 'admin';
    for (const r of roles) {
      const p = ROLE_TO_PERSONA[r];
      if (p) return p;
    }
    return 'general';
  });

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/login`, body).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        this._user.set(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasPermission(code: string): boolean {
    return this._user()?.permissions?.includes(code) ?? false;
  }

  hasRole(code: string): boolean {
    return this._user()?.roles?.includes(code) ?? false;
  }

  /** True if the user holds ANY of the given permission codes (or is admin). */
  hasAnyPermission(codes: string[]): boolean {
    if (this.isAdmin()) return true;
    const perms = this._user()?.permissions ?? [];
    return codes.some((c) => perms.includes(c));
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
