import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const KEY = 'sm_theme';

/** Light/dark theme via [data-theme] on <html>, persisted to localStorage. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(t: Theme): void {
    this.theme.set(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
    this.apply(t);
  }

  private apply(t: Theme): void {
    document.documentElement.setAttribute('data-theme', t);
  }

  private initial(): Theme {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
