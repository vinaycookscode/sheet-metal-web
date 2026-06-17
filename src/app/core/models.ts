/** Shapes mirror the sheet-metal-api responses (which are NOT envelope-wrapped). */

export interface AuthUser {
  id: string;
  fullName: string;
  orgId: string;
  roles: string[];
  permissions: string[];
}

/** A "here's how to fix it" hint attached to a blocker (mirrors the API BlockedException). */
export interface BlockerAction {
  label: string;
  link?: string;
}

/** Structured business-rule blocker surfaced by the API's global exception filter. */
export interface ApiBlocker {
  code: string;
  message: string;
  action?: BlockerAction;
}

export type TaskPriority = 'high' | 'normal' | 'low';

/** One actionable card in the Task Inbox (mirrors the API tasks feed). */
export interface TaskItem {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  link: string;
  actionLabel: string;
  priority: TaskPriority;
}

export interface TaskInbox {
  items: TaskItem[];
  total: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  gstin?: string;
  stateCode?: string;
  paymentTermsDays: number;
  creditLimit: number;
}

export interface CreateCustomer {
  /** Optional — auto-allocated (CUST-...) by the API when omitted. */
  code?: string;
  name: string;
  email?: string;
  gstin?: string;
  stateCode?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  customerId: string;
  status: string;
  description?: string;
  targetDate?: string;
  createdAt: string;
}
export interface CreateProject {
  customerId: string;
  name: string;
  code?: string;
  status?: string;
  description?: string;
  targetDate?: string;
}
export interface ProjectSummary {
  project: Project;
  customer: { id: string; name: string; code: string } | null;
  counts: { inquiries: number; quotes: number; salesOrders: number; openSalesOrders: number };
  orderValue: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  category?: string;
  leadTimeDays: number;
  paymentTermsDays: number;
  rating?: number;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  itemType: string;
  isTraceable: boolean;
}

// ── Sales spine ──
export interface InquiryLine {
  id: string; lineNo: number; partName: string; qty: number;
  materialGradeId?: string; thicknessMm?: number; finishId?: string; targetPrice?: number;
}
export interface Inquiry {
  id: string; number: string; customerId: string; projectId?: string; status: string;
  requiredDate?: string; ownerId?: string; estimatorId?: string; lostReason?: string;
  notes?: string; lines?: InquiryLine[]; createdAt: string;
}
export interface CreateInquiryLine {
  partName: string; qty: number; materialGradeId?: string; thicknessMm?: number; finishId?: string; targetPrice?: number;
}
export interface CreateInquiry {
  customerId: string; projectId: string; requiredDate?: string; notes?: string; lines: CreateInquiryLine[];
}

export interface QuoteLine {
  id: string; lineNo: number; partName: string; primaryQty: number; unitPrice: number;
  materialCost: number; processCost: number; hardwareCost: number; outsideCost: number; setupCost: number;
  marginPct?: number; taxCodeId?: string;
}
export interface QuoteVersion {
  id: string; versionNo: number; validUntil?: string; leadTimeDays?: number; markupPct?: number; terms?: string;
  subtotal: number; taxTotal: number; grandTotal: number; isCurrent: boolean; lines?: QuoteLine[];
}
export interface Quote {
  id: string; number: string; customerId: string; projectId?: string; inquiryId?: string;
  currentVersion: number; status: string; winLossReason?: string; versions?: QuoteVersion[]; createdAt: string;
  /** Present once this quote has been converted — link to the order instead of re-creating. */
  salesOrder?: { id: string; number: string };
}

export interface QuoteDocument {
  title: string;
  number: string;
  date: string;
  validUntil?: string | null;
  leadTimeDays?: number | null;
  terms?: string | null;
  seller: { name: string; plant?: string; gstin?: string; stateCode?: string };
  buyer: { name: string; email?: string; gstin?: string; stateCode?: string };
  lines: Array<{ lineNo: number; description: string; qty: number; unitPrice: number; amount: number }>;
  totals: { subtotal: number; taxTotal: number; grandTotal: number };
  amountInWords: string;
}

export interface SendQuoteEmail {
  to?: string;
  subject?: string;
  body?: string;
}

export interface SendQuoteEmailResult {
  to: string;
  delivered: boolean;
  queued: boolean;
  link?: string;
}

/** Negotiation timeline entry. */
export interface QuoteFollowup {
  id: string;
  kind: string;
  source: string;
  note?: string;
  rejectReason?: string;
  counterAmount?: number;
  createdAt: string;
}

/** Public (customer-facing) quote view. */
export interface PublicQuoteView extends QuoteDocument {
  status: string;
  canRespond: boolean;
}
export interface PublicRespond {
  action: 'accept' | 'reject' | 'negotiate';
  rejectReason?: string;
  counterAmount?: number;
  message?: string;
}

/** What an internal user records as the customer's response. */
export interface RecordQuoteResponse {
  action: 'accept' | 'reject' | 'negotiate' | 'follow_up' | 'note';
  rejectReason?: string;
  counterAmount?: number;
  message?: string;
  nextFollowUpDate?: string;
}

export interface SoLine {
  id: string; lineNo: number; partName: string; qty: number; unitPrice: number;
  promisedDate?: string; status: string; taxCodeId?: string; quoteLineId?: string; partId?: string;
}
export interface SalesOrder {
  id: string; number: string; customerId: string; projectId?: string; status: string;
  customerPoNumber?: string; vendorCode?: string; orderDate: string; lines?: SoLine[]; createdAt: string;
}

// ── Engineering ──
export interface RoutingOp {
  id?: string; opNo?: number; operationId?: string; workCenterId?: string;
  setupMinutes?: number; runSecondsPerUnit?: number; isOutside?: boolean; instructions?: string;
}
export interface BomLine {
  id?: string; componentItemId?: string; componentPartId?: string; qtyPer: number; scrapPct?: number;
}
export interface Part {
  id: string; partNo: string; rev: string; description?: string;
  materialGradeId?: string; thicknessMm?: number; finishId?: string;
  flatLengthMm?: number; flatWidthMm?: number; bendCount?: number; isReleased: boolean;
  routingOps?: RoutingOp[]; bomLines?: BomLine[]; createdAt: string;
}
export interface CreatePart {
  partNo: string; rev?: string; description?: string; materialGradeId?: string; thicknessMm?: number; finishId?: string;
  bendCount?: number; routing?: RoutingOp[]; bom?: BomLine[];
}

// ── Planning / production ──
export interface WoOperation {
  id: string; opNo: number; routingOpId?: string; workCenterId?: string; status: string; isOutside: boolean; qtyGood: number; qtyScrap: number;
}
export interface WorkOrder {
  id: string; number: string; soLineId: string; partId: string; qty: number; qtyCompleted: number; qtyScrapped: number;
  status: string; dueDate?: string; releasedAt?: string; operations?: WoOperation[]; createdAt: string;
}
export interface PurchaseRequisition {
  id: string; itemId: string; qty: number; requiredDate?: string; soLineId?: string; isOrdered: boolean; createdAt: string;
}
export interface MrpResult {
  mrpRunId: string; soLinesPlanned: number;
  workOrders: Array<{ id: string; number: string; partId: string; qty: number }>;
  requisitions: Array<{ id: string; itemId: string; qty: number; soLineId: string }>;
}
export interface MetaOption { id: string; code: string; name: string; }

// ── Procurement ──
export interface PoLine {
  id: string; lineNo: number; itemId: string; qty: number; qtyReceived: number; unitPrice: number; taxCodeId?: string; requisitionId?: string;
}
export interface PurchaseOrder {
  id: string; number: string; supplierId: string; status: string; isSubcontract: boolean; orderDate: string;
  subtotal: number; taxTotal: number; grandTotal: number; lines?: PoLine[]; createdAt: string;
}
export interface GrnLine {
  id: string; poLineId: string; itemId: string; qtyReceived: number; qtyRejected: number; heatNo?: string; lotNo?: string;
}
export interface Grn {
  id: string; number: string; purchaseOrderId: string; supplierId: string; status: string; receivedDate: string; lines?: GrnLine[]; createdAt: string;
}

// ── Quality ──
export interface InspectionChar {
  id: string; characteristic: string; nominal?: number; tolerancePlus?: number; toleranceMinus?: number; measured?: number; result: string;
}
export interface Inspection {
  id: string; kind: string; result: string; soLineId?: string; workOrderId?: string; inspectorId?: string; inspectedAt?: string; characteristics?: InspectionChar[];
}
export interface Ncr {
  id: string; number: string; source?: string; defect: string; isCritical: boolean; disposition: string; status: string;
  costOfQuality?: number; supplierId?: string; workOrderId?: string; createdAt: string; closedAt?: string;
}

// ── Dispatch ──
export interface PackingLine { id: string; soLineId: string; qty: number; boxNo?: string; weightKg?: number; }
export interface Shipment {
  id: string; number: string; salesOrderId: string; status: string; dispatchDate?: string; carrier?: string; trackingNo?: string; totalWeightKg?: number; lines?: PackingLine[]; createdAt: string;
  acceptedAt?: string; acceptedBy?: string; acceptanceNote?: string;
}
export interface EwayBill { id: string; shipmentId: string; ewbNumber?: string; value?: number; distanceKm?: number; vehicleNo?: string; payload?: Record<string, unknown>; generatedAt?: string; }

// ── Finance ──
export interface InvoiceLine { id: string; lineNo: number; description: string; hsnSac?: string; qty: number; unitPrice: number; taxableValue: number; gstRate: number; taxAmount: number; }
export interface Invoice {
  id: string; number: string; customerId: string; salesOrderId?: string; shipmentId?: string; status: string; gstTreatment: string;
  subtotal: number; cgst: number; sgst: number; igst: number; grandTotal: number; amountPaid: number; lines?: InvoiceLine[]; createdAt: string;
}
export interface Payment { id: string; customerId: string; invoiceId?: string; amount: number; method?: string; reference?: string; paidAt: string; }
