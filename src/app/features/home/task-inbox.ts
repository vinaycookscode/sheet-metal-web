import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TasksService } from '../../core/tasks.service';
import { AuthService } from '../../core/auth.service';
import { TaskItem } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';

/**
 * Task Inbox — the role-aware home. Instead of a module menu, the user lands on
 * "what needs me now": high-priority actions first, each deep-linking to the screen
 * (and guided step) that resolves it. Fed by GET /tasks/inbox.
 */
@Component({
  selector: 'app-task-inbox',
  standalone: true,
  imports: [RouterLink, GwCardComponent, GwButtonComponent],
  templateUrl: './task-inbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .inbox__head { margin-bottom: 1.5rem; }
    .inbox__head h1 { margin: 0 0 .25rem; }
    .inbox__section { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; margin: 1.5rem 0 .75rem; }
    .inbox__list { display: flex; flex-direction: column; gap: .75rem; }
    .inbox__row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .inbox__title { margin: 0 0 .15rem; font-weight: 600; }
    .inbox__sub { margin: 0; font-size: .85rem; }
    .inbox__item--high { border-left: 3px solid var(--gw-color-primary, #2563eb); }
    .inbox__empty { text-align: center; padding: 1rem 0; }
    .inbox__empty h2 { margin: 0 0 .25rem; }
  `],
})
export class TaskInboxPage implements OnInit {
  private readonly svc = inject(TasksService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly items = signal<TaskItem[]>([]);

  readonly firstName = computed(() => (this.auth.user()?.fullName ?? '').trim().split(/\s+/)[0] || 'there');
  readonly highItems = computed(() => this.items().filter((i) => i.priority === 'high'));
  readonly laterItems = computed(() => this.items().filter((i) => i.priority !== 'high'));

  ngOnInit(): void {
    this.svc.inbox().subscribe({
      next: (res) => { this.items.set(res.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
