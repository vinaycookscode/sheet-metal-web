import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DispatchService } from '../../core/dispatch.service';
import { EwayBill, Shipment } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwTableComponent, GwTableColumn } from '../../shared/ui/data/table/table.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';
import { GwDrawerComponent } from '../../shared/ui/overlays/drawer/drawer.component';
import { ChallanPrintPage } from './challan-print';

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwTableComponent, GwFormFieldComponent, GwInputComponent, GwAlertComponent, GwDrawerComponent, ChallanPrintPage],
  templateUrl: './shipment-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(DispatchService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly shipment = signal<Shipment | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly eway = signal<EwayBill | null>(null);
  readonly challan = signal<any>(null);
  readonly showEway = signal(false);
  readonly showDoc = signal(false);
  printDoc(): void { window.print(); }

  readonly dispatchForm = this.fb.nonNullable.group({ carrier: [''], trackingNo: [''] });
  readonly ewayForm = this.fb.nonNullable.group({ value: [60000, Validators.min(1)], distanceKm: [100, Validators.min(1)], vehicleNo: ['', Validators.required] });

  readonly lineCols: GwTableColumn[] = [
    { key: 'qty', label: 'Qty', width: '120px', align: 'right' },
    { key: 'boxNo', label: 'Box', width: '120px' },
    { key: 'weightKg', label: 'Weight kg', width: '130px', align: 'right' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.svc.get(this.id).subscribe({
      next: (s) => { this.shipment.set(s); this.loading.set(false); this.svc.getEway(this.id).subscribe({ next: (e) => this.eway.set(e), error: () => {} }); },
      error: () => this.loading.set(false),
    });
  }

  pack(): void { this.act(this.svc.pack(this.id)); }
  dispatch(): void { this.act(this.svc.dispatch(this.id, { carrier: this.dispatchForm.value.carrier || undefined, trackingNo: this.dispatchForm.value.trackingNo || undefined })); }

  private act(obs: ReturnType<DispatchService['pack']>): void {
    this.busy.set(true);
    this.error.set('');
    obs.subscribe({ next: (s) => { this.shipment.set(s); this.busy.set(false); }, error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Action failed'); } });
  }

  viewChallan(): void {
    this.svc.challan(this.id).subscribe({ next: (c) => this.challan.set(c), error: (e) => this.error.set(e?.error?.message ?? 'Challan failed') });
  }

  generateEway(): void {
    if (this.ewayForm.invalid) return;
    this.busy.set(true);
    this.error.set('');
    const v = this.ewayForm.getRawValue();
    this.svc.genEway(this.id, { value: v.value, distanceKm: v.distanceKm, vehicleNo: v.vehicleNo }).subscribe({
      next: (e) => { this.busy.set(false); this.eway.set(e); this.showEway.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'E-way bill failed'); },
    });
  }

  statusVariant(s?: string): string { return { draft: 'neutral', packed: 'info', dispatched: 'success', delivered: 'success' }[s ?? ''] ?? 'neutral'; }
}
