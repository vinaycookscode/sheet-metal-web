import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
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
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly unread = signal(0);
  readonly items = signal<AppNotification[]>([]);
  readonly open = signal(false);
  readonly shake = signal(false);
  private timer?: ReturnType<typeof setInterval>;
  private shakeTimer?: ReturnType<typeof setTimeout>;
  private navSub?: Subscription;

  ngOnInit(): void {
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 30_000);
    // Update promptly after the user does anything that may have created a notification.
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.refresh());
  }
  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.shakeTimer) clearTimeout(this.shakeTimer);
    this.navSub?.unsubscribe();
  }

  @HostListener('window:focus') onFocus(): void { this.refresh(); }
  @HostListener('document:click', ['$event']) onDocClick(e: MouseEvent): void {
    if (this.open() && !this.el.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  private refresh(): void {
    this.svc.unreadCount().subscribe({
      next: (r) => {
        if (r.count > this.unread()) this.triggerShake();
        this.unread.set(r.count);
      },
      error: () => {},
    });
  }
  private triggerShake(): void {
    this.shake.set(true);
    if (this.shakeTimer) clearTimeout(this.shakeTimer);
    this.shakeTimer = setTimeout(() => this.shake.set(false), 900);
  }

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) this.svc.list({ limit: 15 }).subscribe({ next: (n) => this.items.set(n), error: () => {} });
  }

  openItem(n: AppNotification): void {
    this.open.set(false);
    const go = () => {
      if (!n.link) return;
      const url = n.link + (n.link.includes('?') ? '&' : '?') + 'flash=1';
      this.router.navigateByUrl(url);
    };
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
