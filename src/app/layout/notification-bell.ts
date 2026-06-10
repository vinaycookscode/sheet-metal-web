import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService, AppNotification } from '../core/notifications.service';
import { GwIconButtonComponent } from '../shared/ui/buttons/icon-button/icon-button.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe, GwIconButtonComponent],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly svc = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly unread = signal(0);
  readonly items = signal<AppNotification[]>([]);
  readonly open = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 60_000);
  }
  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private refresh(): void {
    this.svc.unreadCount().subscribe({ next: (r) => this.unread.set(r.count), error: () => {} });
  }

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) this.svc.list({ limit: 15 }).subscribe({ next: (n) => this.items.set(n), error: () => {} });
  }

  openItem(n: AppNotification): void {
    this.open.set(false);
    const go = () => { if (n.link) this.router.navigateByUrl(n.link); };
    if (!n.isRead) {
      this.svc.markRead(n.id).subscribe({ next: () => { n.isRead = true; this.refresh(); go(); }, error: go });
    } else {
      go();
    }
  }

  markAll(): void {
    this.svc.markAllRead().subscribe({
      next: () => { this.items.update((list) => list.map((n) => ({ ...n, isRead: true }))); this.unread.set(0); },
      error: () => {},
    });
  }
}
