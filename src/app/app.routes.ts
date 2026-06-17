import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AuthService } from './core/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    // Public, unauthenticated customer quote response (token link from the email).
    path: 'quote-response/:token',
    loadComponent: () => import('./pages/quote-response/quote-response').then((m) => m.QuoteResponsePage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.ShellComponent),
    children: [
      // Persona-aware landing: admins get the data dashboard, everyone else gets
      // their Task Inbox ("what needs me now") rather than a module menu.
      { path: '', pathMatch: 'full', redirectTo: () => (inject(AuthService).isAdmin() ? '/dashboard' : '/inbox') },
      { path: 'inbox', loadComponent: () => import('./features/home/task-inbox').then((m) => m.TaskInboxPage) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage) },
      { path: 'getting-started', loadComponent: () => import('./features/getting-started/getting-started').then((m) => m.GettingStartedPage) },
      { path: 'kpis', loadComponent: () => import('./features/analytics/kpi-dashboard').then((m) => m.KpiDashboardPage) },
      { path: 'inquiries', loadComponent: () => import('./features/inquiries/inquiries-list').then((m) => m.InquiriesListPage) },
      { path: 'inquiries/:id', loadComponent: () => import('./features/inquiries/inquiry-detail').then((m) => m.InquiryDetailPage) },
      { path: 'quotes', loadComponent: () => import('./features/quotes/quotes-list').then((m) => m.QuotesListPage) },
      { path: 'follow-ups', loadComponent: () => import('./features/quotes/followups-list').then((m) => m.FollowupsListPage) },
      { path: 'quotes/:id', loadComponent: () => import('./features/quotes/quote-detail').then((m) => m.QuoteDetailPage) },
      { path: 'sales-orders', loadComponent: () => import('./features/sales-orders/so-list').then((m) => m.SoListPage) },
      { path: 'sales-orders/:id', loadComponent: () => import('./features/sales-orders/so-detail').then((m) => m.SoDetailPage) },
      { path: 'projects', loadComponent: () => import('./features/projects/projects-list').then((m) => m.ProjectsListPage) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail').then((m) => m.ProjectDetailPage) },
      { path: 'parts', loadComponent: () => import('./features/engineering/parts-list').then((m) => m.PartsListPage) },
      { path: 'parts/:id', loadComponent: () => import('./features/engineering/part-detail').then((m) => m.PartDetailPage) },
      { path: 'work-orders', loadComponent: () => import('./features/work-orders/wo-list').then((m) => m.WoListPage) },
      { path: 'work-orders/:id', loadComponent: () => import('./features/work-orders/wo-detail').then((m) => m.WoDetailPage) },
      { path: 'production-board', loadComponent: () => import('./features/production/production-board').then((m) => m.ProductionBoardPage) },
      { path: 'rfqs', loadComponent: () => import('./features/procurement/rfq-list').then((m) => m.RfqListPage) },
      { path: 'rfqs/:id', loadComponent: () => import('./features/procurement/rfq-detail').then((m) => m.RfqDetailPage) },
      { path: 'purchase-orders', loadComponent: () => import('./features/procurement/po-list').then((m) => m.PoListPage) },
      { path: 'purchase-orders/:id', loadComponent: () => import('./features/procurement/po-detail').then((m) => m.PoDetailPage) },
      { path: 'stock', loadComponent: () => import('./features/inventory/stock-page').then((m) => m.StockPage) },
      { path: 'capacity', loadComponent: () => import('./features/planning/capacity-page').then((m) => m.CapacityPage) },
      { path: 'inspections', loadComponent: () => import('./features/quality/inspections-list').then((m) => m.InspectionsListPage) },
      { path: 'inspections/:id', loadComponent: () => import('./features/quality/inspection-detail').then((m) => m.InspectionDetailPage) },
      { path: 'ncrs', loadComponent: () => import('./features/quality/ncrs-list').then((m) => m.NcrsListPage) },
      { path: 'shipments', loadComponent: () => import('./features/dispatch/shipments-list').then((m) => m.ShipmentsListPage) },
      { path: 'shipments/:id', loadComponent: () => import('./features/dispatch/shipment-detail').then((m) => m.ShipmentDetailPage) },
      { path: 'invoices', loadComponent: () => import('./features/finance/invoices-list').then((m) => m.InvoicesListPage) },
      { path: 'invoices/:id', loadComponent: () => import('./features/finance/invoice-detail').then((m) => m.InvoiceDetailPage) },
      { path: 'closure', loadComponent: () => import('./features/finance/closure-page').then((m) => m.ClosurePage) },
      { path: 'payables', loadComponent: () => import('./features/finance/payables-page').then((m) => m.PayablesPage) },
      { path: 'customers', loadComponent: () => import('./features/customers/customers-page').then((m) => m.CustomersPage) },
      { path: 'suppliers', loadComponent: () => import('./features/suppliers/suppliers-page').then((m) => m.SuppliersPage) },
      { path: 'items', loadComponent: () => import('./features/items/items-page').then((m) => m.ItemsPage) },
      { path: 'admin/users', loadComponent: () => import('./features/admin/users-page').then((m) => m.AdminUsersPage) },
      { path: 'admin/roles', loadComponent: () => import('./features/admin/roles-page').then((m) => m.AdminRolesPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
