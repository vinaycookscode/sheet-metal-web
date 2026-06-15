import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { GwTopNavComponent } from '../shared/ui/navigation/top-nav/top-nav.component';
import { GwSidebarComponent, GwSidebarSection } from '../shared/ui/navigation/sidebar/sidebar.component';
import { GwButtonComponent } from '../shared/ui/buttons/button/button.component';
import { GwIconButtonComponent } from '../shared/ui/buttons/icon-button/icon-button.component';
import { NotificationBellComponent } from './notification-bell';
import { ScanBoxComponent } from './scan-box';
import { GwDialogComponent } from '../shared/ui/overlays/dialog/dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, GwTopNavComponent, GwSidebarComponent, GwButtonComponent, GwIconButtonComponent, NotificationBellComponent, ScanBoxComponent, GwDialogComponent],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeSvc = inject(ThemeService);

  readonly user = this.auth.user;
  readonly theme = this.themeSvc.theme;
  toggleTheme(): void { this.themeSvc.toggle(); }

  readonly sections: GwSidebarSection[] = [
    {
      items: [
        { key: 'getting-started', label: 'Getting Started', icon: 'Compass', link: '/getting-started' },
        { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', link: '/dashboard' },
        { key: 'kpis', label: 'Management KPIs', icon: 'TrendingUp', link: '/kpis' },
      ],
    },
    {
      label: 'Sales',
      items: [
        { key: 'inquiries', label: 'Inquiries', icon: 'MessageSquare', link: '/inquiries' },
        { key: 'quotes', label: 'Quotes', icon: 'FileText', link: '/quotes' },
        { key: 'sales-orders', label: 'Sales Orders', icon: 'ClipboardList', link: '/sales-orders' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { key: 'parts', label: 'Engineering', icon: 'Settings', link: '/parts' },
        { key: 'work-orders', label: 'Work Orders', icon: 'ClipboardCheck', link: '/work-orders' },
        { key: 'capacity', label: 'Capacity', icon: 'Gauge', link: '/capacity' },
        { key: 'production-board', label: 'Production', icon: 'LayoutGrid', link: '/production-board' },
        { key: 'rfqs', label: 'RFQs', icon: 'FileSearch', link: '/rfqs' },
        { key: 'purchase-orders', label: 'Purchasing', icon: 'Receipt', link: '/purchase-orders' },
        { key: 'stock', label: 'Inventory', icon: 'Warehouse', link: '/stock' },
      ],
    },
    {
      label: 'Quality & Dispatch',
      items: [
        { key: 'inspections', label: 'Inspections', icon: 'CheckSquare', link: '/inspections' },
        { key: 'ncrs', label: 'NCRs', icon: 'AlertTriangle', link: '/ncrs' },
        { key: 'shipments', label: 'Shipments', icon: 'ArrowUpRight', link: '/shipments' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { key: 'invoices', label: 'Invoices', icon: 'CreditCard', link: '/invoices' },
        { key: 'payables', label: 'Payables', icon: 'IndianRupee', link: '/payables' },
        { key: 'closure', label: 'Closure', icon: 'CheckCircle', link: '/closure' },
      ],
    },
    {
      label: 'Master Data',
      items: [
        { key: 'customers', label: 'Customers', icon: 'Users', link: '/customers' },
        { key: 'suppliers', label: 'Suppliers', icon: 'Building2', link: '/suppliers' },
        { key: 'items', label: 'Items', icon: 'Package', link: '/items' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { key: 'admin-users', label: 'Users', icon: 'Users', link: '/admin/users' },
        { key: 'admin-roles', label: 'Roles', icon: 'ShieldCheck', link: '/admin/roles' },
      ],
    },
  ];

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly activeKey = computed(() => this.url().split('/')[1] || 'customers');

  /** Brief highlight when arriving from a notification (link carries ?flash=1). */
  readonly flash = signal(false);
  private flashTimer?: ReturnType<typeof setTimeout>;
  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.mobileNavOpen.set(false); // close the mobile drawer after navigating
      if (e.urlAfterRedirects.includes('flash=1')) {
        this.flash.set(true);
        if (this.flashTimer) clearTimeout(this.flashTimer);
        this.flashTimer = setTimeout(() => this.flash.set(false), 1800);
      }
    });
  }

  /** Mobile slide-in nav drawer. */
  readonly mobileNavOpen = signal(false);
  toggleNav(): void { this.mobileNavOpen.update((v) => !v); }
  closeNav(): void { this.mobileNavOpen.set(false); }

  /** First-login welcome (onboarding) — shown once, then remembered. */
  readonly showWelcome = signal(typeof localStorage !== 'undefined' && !localStorage.getItem('sm_welcomed'));
  dismissWelcome(): void {
    try { localStorage.setItem('sm_welcomed', '1'); } catch { /* ignore */ }
    this.showWelcome.set(false);
  }
  startGuide(): void {
    this.dismissWelcome();
    this.router.navigate(['/getting-started']);
  }

  logout(): void {
    this.auth.logout();
  }
}
