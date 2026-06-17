import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PublicQuoteView, PublicRespond } from './models';

/** Customer-facing (unauthenticated) quote access via the emailed token link. */
@Injectable({ providedIn: 'root' })
export class PublicQuoteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/public/quotes`;

  view(token: string) {
    return this.http.get<PublicQuoteView>(`${this.base}/${token}`);
  }

  respond(token: string, dto: PublicRespond) {
    return this.http.post<{ ok: boolean; status: string }>(`${this.base}/${token}/respond`, dto);
  }
}
