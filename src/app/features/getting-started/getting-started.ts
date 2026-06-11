import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';

interface Stage { n: number; title: string; desc: string; icon: string; link: string; }
interface Phase { label: string; hint: string; stages: Stage[]; }

@Component({
  selector: 'app-getting-started',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, GwCardComponent],
  templateUrl: './getting-started.html',
  styleUrls: ['./getting-started.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GettingStartedPage {
  readonly phases: Phase[] = [
    {
      label: 'Win the work',
      hint: 'Turn a customer enquiry into a confirmed order',
      stages: [
        { n: 1, title: 'Inquiry', desc: 'Capture a customer enquiry and the parts they want quoted.', icon: 'MessageSquare', link: '/inquiries' },
        { n: 2, title: 'Quote', desc: 'Estimate cost, set price & margin, send and revise quotes.', icon: 'FileText', link: '/quotes' },
        { n: 3, title: 'Sales Order', desc: 'Convert an accepted quote into a confirmed sales order.', icon: 'ClipboardList', link: '/sales-orders' },
      ],
    },
    {
      label: 'Make it',
      hint: 'Engineer, plan, buy and produce the parts',
      stages: [
        { n: 4, title: 'Engineering', desc: 'Define each part: routing (operations) + BOM, then release to plan.', icon: 'Settings', link: '/parts' },
        { n: 5, title: 'MRP & Work Orders', desc: 'Plan work orders and purchase requisitions from released orders.', icon: 'ClipboardCheck', link: '/work-orders' },
        { n: 6, title: 'Purchasing', desc: 'Source via RFQ, raise POs, and receive material (GRN).', icon: 'Receipt', link: '/purchase-orders' },
        { n: 7, title: 'Inventory', desc: 'Track raw material & finished goods; clear incoming QC.', icon: 'Warehouse', link: '/stock' },
        { n: 8, title: 'Production', desc: 'Clock operations on/off and track work-order progress.', icon: 'LayoutGrid', link: '/production-board' },
      ],
    },
    {
      label: 'Assure & ship',
      hint: 'Inspect, then dispatch to the customer',
      stages: [
        { n: 9, title: 'Quality', desc: 'Record inspections and raise/close NCRs before shipping.', icon: 'CheckSquare', link: '/inspections' },
        { n: 10, title: 'Dispatch', desc: 'Pack, dispatch, e-way bill, delivery challan and capture POD.', icon: 'ArrowUpRight', link: '/shipments' },
      ],
    },
    {
      label: 'Get paid & close',
      hint: 'Invoice, collect, and close the project',
      stages: [
        { n: 11, title: 'Invoice & Payments', desc: 'Raise GST invoices, collect payments, pay vendors (AP).', icon: 'CreditCard', link: '/invoices' },
        { n: 12, title: 'Closure', desc: 'Acceptance + checklist, review profitability, close the order.', icon: 'CheckCircle', link: '/closure' },
      ],
    },
  ];
}
