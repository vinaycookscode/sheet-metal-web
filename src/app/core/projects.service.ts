import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CreateProject, Project, ProjectSummary } from './models';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/projects`;

  list(opts: { customerId?: string; status?: string; search?: string } = {}) {
    let params = new HttpParams();
    if (opts.customerId) params = params.set('customerId', opts.customerId);
    if (opts.status) params = params.set('status', opts.status);
    if (opts.search) params = params.set('search', opts.search);
    return this.http.get<Project[]>(this.base, { params });
  }

  get(id: string) {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  summary(id: string) {
    return this.http.get<ProjectSummary>(`${this.base}/${id}/summary`);
  }

  create(dto: CreateProject) {
    return this.http.post<Project>(this.base, dto);
  }

  update(id: string, dto: Partial<CreateProject>) {
    return this.http.patch<Project>(`${this.base}/${id}`, dto);
  }
}
