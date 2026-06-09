import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CreateCustomer, Customer } from './models';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/customers`;

  list(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<Customer[]>(`${this.base}${q}`);
  }

  create(dto: CreateCustomer) {
    return this.http.post<Customer>(this.base, dto);
  }
}
