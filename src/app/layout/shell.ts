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
import { BlockerBannerComponent } from '../shared/blocker-banner/blocker-banner.component';

/** A nav entry plus its access gate (see ShellComponent.navModel). */
interface NavItem {
  key: string;
  label: string;
  icon: string;
  link: string;
  /** Visible if the user holds ANY of these permission codes. Omit for "always visible". */
  perms?: string[];
  /** Visible only to admins (e.g. management KPIs, user/role admin). */
  adminOnly?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, GwTopNavComponent, GwSidebarComponent, GwButtonComponent, GwIconButtonComponent, NotificationBellComponent, ScanBoxComponent, GwDialogComponent, BlockerBannerComponent],
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

  /**
   * Full nav model with per-item access gates. The visible {@link sections} are computed
   * from this by role/permission, so each persona sees only their part of the app
   * (a Sales user gets Workspace + Sales + Master Data, not the whole ERP). Admin sees all.
   * `perms` = visible if the user holds ANY of these; `adminOnly` = admin/manager only.
   */
  private readonly navModel: NavSection[] = [
    {
      items: [
        { key: 'getting-started', label: 'Getting Started', icon: 'Compass', link: '/getting-started' },
        { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', link: '/dashboard' },
        { key: 'kpis', label: 'Management KPIs', icon: 'TrendingUp', link: '/kpis', adminOnly: true },
      ],
    },
    {
      label: 'Sales',
      items: [
        { key: 'inquiries', label: 'Inquiries', icon: 'MessageSquare', link: '/inquiries', perms: ['inquiry.read'] },
        { key: 'quotes', label: 'Quotes', icon: 'FileText', link: '/quotes', perms: ['quote.read'] },
        { key: 'sales-orders', label: 'Sales Orders', icon: 'ClipboardList', link: '/sales-orders', perms: ['so.read'] },
      ],
    },
    {
      label: 'Operations',
      items: [
        { key: 'parts', label: 'Engineering', icon: 'Settings', link: '/parts', perms: ['part.read'] },
        { key: 'work-orders', label: 'Work Orders', icon: 'ClipboardCheck', link: '/work-orders', perms: ['wo.read'] },
        { key: 'capacity', label: 'Capacity', icon: 'Gauge', link: '/capacity', perms: ['wo.read'] },
        { key: 'production-board', label: 'Production', icon: 'LayoutGrid', link: '/production-board', perms: ['mes.read', 'wo.read'] },
        { key: 'rfqs', label: 'Supplier RFQs', icon: 'FileSearch', link: '/rfqs', perms: ['po.read'] },
        { key: 'purchase-orders', label: 'Purchasing', icon: 'Receipt', link: '/purchase-orders', perms: ['po.read'] },
        { key: 'stock', label: 'Inventory', icon: 'Warehouse', link: '/stock', perms: ['stock.read'] },
      ],
    },
    {
      label: 'Quality & Dispatch',
      items: [
        { key: 'inspections', label: 'Inspections', icon: 'CheckSquare', link: '/inspections', perms: ['inspection.read'] },
        { key: 'ncrs', label: 'NCRs', icon: 'AlertTriangle', link: '/ncrs', perms: ['ncr.read'] },
        { key: 'shipments', label: 'Shipments', icon: 'ArrowUpRight', link: '/shipments', perms: ['dispatch.read'] },
      ],
    },
    {
      label: 'Finance',
      items: [
        { key: 'invoices', label: 'Invoices', icon: 'CreditCard', link: '/invoices', perms: ['invoice.read'] },
        { key: 'payables', label: 'Payables', icon: 'IndianRupee', link: '/payables', perms: ['invoice.read', 'payment.read'] },
        { key: 'closure', label: 'Closure', icon: 'CheckCircle', link: '/closure', perms: ['closure.read'] },
      ],
    },
    {
      label: 'Master Data',
      items: [
        { key: 'customers', label: 'Customers', icon: 'Users', link: '/customers', perms: ['customer.read'] },
        { key: 'suppliers', label: 'Suppliers', icon: 'Building2', link: '/suppliers', perms: ['supplier.read'] },
        { key: 'items', label: 'Items', icon: 'Package', link: '/items', perms: ['item.read'] },
      ],
    },
    {
      label: 'Administration',
      items: [
        { key: 'admin-users', label: 'Users', icon: 'Users', link: '/admin/users', adminOnly: true },
        { key: 'admin-roles', label: 'Roles', icon: 'ShieldCheck', link: '/admin/roles', adminOnly: true },
      ],
    },
  ];

  /** Nav filtered to what the current user may access; empty sections are dropped. */
  readonly sections = computed<GwSidebarSection[]>(() =>
    this.navModel
      .map((s) => ({ label: s.label, items: s.items.filter((i) => this.canSee(i)) }))
      .filter((s) => s.items.length > 0)
      .map((s) => ({
        label: s.label,
        items: s.items.map(({ key, label, icon, link }) => ({ key, label, icon, link })),
      })),
  );

  private canSee(i: NavItem): boolean {
    if (i.adminOnly) return this.auth.isAdmin();
    if (!i.perms?.length) return true;
    return this.auth.hasAnyPermission(i.perms);
  }

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
