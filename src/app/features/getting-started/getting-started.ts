import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface Stage { n: number; title: string; desc: string; icon: string; link: string; phase: string; }
interface Conn { x1: number; y1: number; x2: number; y2: number; }
interface Dot { x: number; y: number; }

@Component({
  selector: 'app-getting-started',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './getting-started.html',
  styleUrls: ['./getting-started.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GettingStartedPage implements AfterViewInit, OnDestroy {
  readonly stages: Stage[] = [
    { n: 1, title: 'Inquiry', desc: 'Capture a customer enquiry and the parts to quote.', icon: 'MessageSquare', link: '/inquiries', phase: 'Win the work' },
    { n: 2, title: 'Quote', desc: 'Estimate cost, set price & margin, send and revise.', icon: 'FileText', link: '/quotes', phase: 'Win the work' },
    { n: 3, title: 'Sales Order', desc: 'Convert an accepted quote into a confirmed order.', icon: 'ClipboardList', link: '/sales-orders', phase: 'Win the work' },
    { n: 4, title: 'Engineering', desc: 'Define routing + BOM, then release to plan.', icon: 'Settings', link: '/parts', phase: 'Make it' },
    { n: 5, title: 'MRP & Work Orders', desc: 'Plan work orders & requisitions from released orders.', icon: 'ClipboardCheck', link: '/work-orders', phase: 'Make it' },
    { n: 6, title: 'Purchasing', desc: 'RFQ, raise POs, and receive material (GRN).', icon: 'Receipt', link: '/purchase-orders', phase: 'Make it' },
    { n: 7, title: 'Inventory', desc: 'Track raw & finished goods; clear incoming QC.', icon: 'Warehouse', link: '/stock', phase: 'Make it' },
    { n: 8, title: 'Production', desc: 'Clock operations and track work-order progress.', icon: 'LayoutGrid', link: '/production-board', phase: 'Make it' },
    { n: 9, title: 'Quality', desc: 'Inspections and NCRs before shipping.', icon: 'CheckSquare', link: '/inspections', phase: 'Assure & ship' },
    { n: 10, title: 'Dispatch', desc: 'Pack, dispatch, e-way bill, challan and POD.', icon: 'ArrowUpRight', link: '/shipments', phase: 'Assure & ship' },
    { n: 11, title: 'Invoice & Payments', desc: 'GST invoices, collect payments, pay vendors.', icon: 'CreditCard', link: '/invoices', phase: 'Get paid & close' },
    { n: 12, title: 'Closure', desc: 'Acceptance, checklist, profitability, close.', icon: 'CheckCircle', link: '/closure', phase: 'Get paid & close' },
  ];

  @ViewChild('flow') flowRef!: ElementRef<HTMLElement>;
  @ViewChildren('node') nodeRefs!: QueryList<ElementRef<HTMLElement>>;

  readonly cols = signal(4);
  readonly conns = signal<Conn[]>([]);
  readonly startDot = signal<Dot | null>(null);
  readonly endDot = signal<Dot | null>(null);
  readonly svgW = signal(0);
  readonly svgH = signal(0);

  private ro?: ResizeObserver;

  /** Serpentine (boustrophedon) placement: rows alternate left→right / right→left. */
  gridRow(i: number): number { return Math.floor(i / this.cols()) + 1; }
  gridCol(i: number): number {
    const c = this.cols();
    const row = Math.floor(i / c);
    const pos = i % c;
    return (row % 2 === 0 ? pos : c - 1 - pos) + 1;
  }

  ngAfterViewInit(): void {
    this.ro = new ResizeObserver(() => this.schedule());
    this.ro.observe(this.flowRef.nativeElement);
    this.nodeRefs.changes.subscribe(() => this.schedule());
    this.schedule();
  }
  ngOnDestroy(): void { this.ro?.disconnect(); }

  private schedule(): void { requestAnimationFrame(() => this.recompute()); }

  private recompute(): void {
    const cont = this.flowRef?.nativeElement;
    if (!cont) return;
    const width = cont.clientWidth;
    const want = width > 1040 ? 4 : width > 640 ? 2 : 1;
    if (want !== this.cols()) { this.cols.set(want); this.schedule(); return; } // re-layout, then measure

    const base = cont.getBoundingClientRect();
    this.svgW.set(base.width);
    this.svgH.set(base.height);

    const r = this.nodeRefs.map((ref) => {
      const b = ref.nativeElement.getBoundingClientRect();
      return { x: b.left - base.left, y: b.top - base.top, w: b.width, h: b.height, cx: b.left - base.left + b.width / 2, cy: b.top - base.top + b.height / 2 };
    });
    if (!r.length) return;

    const conns: Conn[] = [];
    for (let i = 0; i < r.length - 1; i++) {
      const a = r[i], b = r[i + 1];
      const sameRow = Math.abs(a.cy - b.cy) < a.h / 2;
      if (sameRow) {
        if (b.cx > a.cx) conns.push({ x1: a.x + a.w, y1: a.cy, x2: b.x, y2: b.cy });
        else conns.push({ x1: a.x, y1: a.cy, x2: b.x + b.w, y2: b.cy });
      } else {
        conns.push({ x1: a.cx, y1: a.y + a.h, x2: b.cx, y2: b.y }); // row turn → vertical
      }
    }
    this.conns.set(conns);
    const first = r[0], last = r[r.length - 1];
    this.startDot.set({ x: Math.max(first.x - 20, 6), y: first.cy });
    this.endDot.set({ x: Math.min(last.x + last.w + 20, base.width - 6), y: last.cy });
  }
}
