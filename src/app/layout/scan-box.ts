import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GwIconButtonComponent } from '../shared/ui/buttons/icon-button/icon-button.component';
import { resolveScan } from '../shared/scan-routes';

@Component({
  selector: 'app-scan-box',
  standalone: true,
  imports: [GwIconButtonComponent],
  templateUrl: './scan-box.html',
  styleUrl: './scan-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanBoxComponent {
  private readonly router = inject(Router);
  @ViewChild('inp') inp?: ElementRef<HTMLInputElement>;

  readonly open = signal(false);
  readonly value = signal('');
  readonly error = signal('');

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    this.error.set('');
    if (next) setTimeout(() => this.inp?.nativeElement.focus(), 0);
  }

  submit(): void {
    const raw = this.value().trim();
    if (!raw) return;
    const path = resolveScan(raw);
    if (!path) {
      this.error.set(`Unrecognized code: "${raw}"`);
      return;
    }
    this.open.set(false);
    this.value.set('');
    this.error.set('');
    this.router.navigateByUrl(path);
  }
}
