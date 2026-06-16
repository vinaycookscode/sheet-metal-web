import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TaskInbox } from './models';

/** The caller's "what needs me now" feed, assembled server-side from their visible work. */
@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tasks`;

  inbox() {
    return this.http.get<TaskInbox>(`${this.base}/inbox`);
  }
}
