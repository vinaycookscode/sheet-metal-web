import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ApiBlocker } from './models';

/**
 * Holds the current "humane blocker" — a business-rule gate that stopped an action,
 * with a reason and an optional one-click fix. Set by the HTTP error interceptor when
 * the API returns a `{ blocked: true, code, message, action }` body; rendered app-wide
 * by the BlockerBanner in the shell. Auto-clears once the user navigates away.
 */
@Injectable({ providedIn: 'root' })
export class BlockerService {
  private readonly router = inject(Router);
  private readonly _current = signal<ApiBlocker | null>(null);
  readonly current = this._current.asReadonly();

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this._current.set(null));
  }

  show(blocker: ApiBlocker): void {
    this._current.set(blocker);
  }

  clear(): void {
    this._current.set(null);
  }
}
