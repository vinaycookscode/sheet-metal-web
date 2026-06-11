import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Invoice, Payment } from './models';

export interface ArAging {
  totalOutstanding: number;
  buckets: { current: number; d31_60: number; d61_90: number; d90plus: number };
  invoices: Array<{ invoice: string; customer: string; invoiceDate: string; outstanding: number; ageDays: number; bucket: string }>;
}
export interface ClosureChecklist { allShipped: boolean; invoiced: boolean; paid: boolean; accepted: boolean; qcClear: boolean; readyToClose: boolean; }
export interface ClosureReport {
  salesOrder: string; status: string;
  checklist: ClosureChecklist;
  lines: Array<{ partName: string; revenue: number; estimatedCost: number; actualMaterial: number; actualLabor: number; actualCost: number; margin: number; variance: number }>;
  totals: { revenue: number; estimatedCost: number; actualMaterial: number; actualLabor: number; actualCost: number; realizedMargin: number; marginPct: number | null };
}

export interface SupplierInvoiceRow {
  id: string; supplierRef?: string; invoiceDate: string; subtotal: number; taxTotal: number; grandTotal: number;
  amountPaid: number; matchStatus: string; status: string; supplier: string; poNumber?: string;
}
export interface ApAging {
  totalOutstanding: number;
  buckets: { current: number; d31_60: number; d61_90: number; d90plus: number };
  invoices: Array<{ supplierInvoice: string; supplier: string; invoiceDate: string; outstanding: number; ageDays: number; bucket: string }>;
}

export interface Address { line1?: string; line2?: string; city?: string; state?: string; pincode?: string; }
export interface InvoiceDocument {
  title: string;
  seller: { name: string; plant: string; gstin?: string; stateCode?: string; address?: Address };
  buyer: { name: string; code?: string; gstin?: string; stateCode?: string; billingAddress?: Address; shippingAddress?: Address };
  invoice: { number: string; date: string; status: string; gstTreatment: string; placeOfSupply?: string; reverseCharge: boolean; salesOrder?: string | null; customerPo?: string | null; shipment?: string | null };
  lines: Array<{ lineNo: number; description: string; hsnSac: string; qty: number; unitPrice: number; taxableValue: number; gstRate: number; cgst: number; sgst: number; igst: number; amount: number }>;
  totals: { subtotal: number; cgst: number; sgst: number; igst: number; taxTotal: number; grandTotal: number; amountPaid: number; balance: number };
  amountInWords: string;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  invoices(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<Invoice[]>(`${this.api}/invoices${q}`);
  }
  invoice(id: string) { return this.http.get<Invoice>(`${this.api}/invoices/${id}`); }
  fromShipment(shipmentId: string) { return this.http.post<Invoice>(`${this.api}/invoices/from-shipment/${shipmentId}`, {}); }
  issue(id: string) { return this.http.post<Invoice>(`${this.api}/invoices/${id}/issue`, {}); }
  document(id: string): Observable<InvoiceDocument> { return this.http.get<InvoiceDocument>(`${this.api}/invoices/${id}/document`); }

  payments(invoiceId?: string) {
    const q = invoiceId ? `?invoiceId=${invoiceId}` : '';
    return this.http.get<Payment[]>(`${this.api}/payments${q}`);
  }
  recordPayment(body: { customerId: string; invoiceId?: string; amount: number; method?: string; reference?: string }) {
    return this.http.post<Payment>(`${this.api}/payments`, body);
  }
  arAging() { return this.http.get<ArAging>(`${this.api}/payments/ar-aging`); }

  closureReport(salesOrderId: string) { return this.http.get<ClosureReport>(`${this.api}/closure/sales-orders/${salesOrderId}`); }
  closeSo(salesOrderId: string) { return this.http.post<ClosureReport>(`${this.api}/closure/sales-orders/${salesOrderId}/close`, {}); }

  // --- Accounts Payable (SM-241/242/243) ---
  supplierInvoices() { return this.http.get<SupplierInvoiceRow[]>(`${this.api}/supplier-invoices`); }
  createSupplierInvoice(poId: string, body: { supplierRef?: string; invoiceDate?: string }) {
    return this.http.post<{ id: string }>(`${this.api}/supplier-invoices/from-po/${poId}`, body);
  }
  matchSupplierInvoice(id: string) { return this.http.post<{ receivedValue: number; invoicedValue: number; variance: number; matchStatus: string }>(`${this.api}/supplier-invoices/${id}/match`, {}); }
  approveSupplierInvoice(id: string) { return this.http.post(`${this.api}/supplier-invoices/${id}/approve`, {}); }
  recordVendorPayment(body: { supplierInvoiceId?: string; supplierId?: string; amount: number; method?: string; reference?: string }) {
    return this.http.post(`${this.api}/vendor-payments`, body);
  }
  apAging() { return this.http.get<ApAging>(`${this.api}/vendor-payments/ap-aging`); }
}
