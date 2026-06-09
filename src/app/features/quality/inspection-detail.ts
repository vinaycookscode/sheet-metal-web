import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { QualityService } from '../../core/quality.service';
import { Inspection } from '../../core/models';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwBadgeComponent } from '../../shared/ui/display/badge/badge.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwSelectComponent, GwSelectOption } from '../../shared/ui/forms/select/select.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

interface CharMeta { id: string; label: string; dimensional: boolean; spec: string; }

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GwCardComponent, GwButtonComponent, GwBadgeComponent, GwInputComponent, GwSelectComponent, GwAlertComponent],
  templateUrl: './inspection-detail.html',
  styles: [`.rec-row{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border,#eee)}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(QualityService);
  private readonly fb = inject(FormBuilder);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly insp = signal<Inspection | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly charMeta = signal<CharMeta[]>([]);
  readonly passFail: GwSelectOption[] = [{ value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }];

  readonly recs = this.fb.array<FormGroup>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.svc.inspection(this.id).subscribe({
      next: (i) => { this.setInsp(i); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private setInsp(i: Inspection): void {
    this.insp.set(i);
    const chars = i.characteristics ?? [];
    this.charMeta.set(chars.map((c) => ({
      id: c.id, label: c.characteristic, dimensional: c.nominal != null,
      spec: c.nominal != null ? `${c.nominal} +${c.tolerancePlus ?? 0}/−${c.toleranceMinus ?? 0}` : 'attribute',
    })));
    this.recs.clear();
    chars.forEach((c) => this.recs.push(this.fb.group({ measured: [c.measured ?? null], result: [c.result === 'pending' ? '' : c.result] })));
  }

  record(): void {
    const results = this.recs.controls.map((c, idx) => {
      const meta = this.charMeta()[idx];
      return meta.dimensional
        ? { charId: meta.id, measured: c.value.measured != null ? Number(c.value.measured) : undefined }
        : { charId: meta.id, result: (c.value.result || undefined) as 'pass' | 'fail' | undefined };
    });
    this.busy.set(true);
    this.error.set('');
    this.svc.record(this.id, results).subscribe({
      next: (i) => { this.setInsp(i); this.busy.set(false); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.message ?? 'Record failed'); },
    });
  }

  resultVariant(r?: string): string { return { pass: 'success', fail: 'danger', pending: 'neutral' }[r ?? ''] ?? 'neutral'; }
}
