import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface DocMeta {
  id: string;
  entityType: string;
  entityId: string;
  kind: string;
  fileName: string;
  mimeType?: string;
  version: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/documents`;

  list(entityType: string, entityId: string) {
    return this.http.get<DocMeta[]>(`${this.base}?entityType=${entityType}&entityId=${entityId}`);
  }
  upload(entityType: string, entityId: string, kind: string, file: File, entityRef?: string) {
    const fd = new FormData();
    fd.append('entityType', entityType);
    fd.append('entityId', entityId);
    fd.append('kind', kind);
    if (entityRef) fd.append('entityRef', entityRef);
    fd.append('file', file);
    return this.http.post<DocMeta>(this.base, fd);
  }
  download(id: string) {
    return this.http.get(`${this.base}/${id}/download`, { responseType: 'blob' });
  }
  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
