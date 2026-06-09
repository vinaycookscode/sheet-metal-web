import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse } from './models';

const TOKEN_KEY = 'sm_access_token';
const USER_KEY = 'sm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _user = signal<AuthUser | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

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

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
