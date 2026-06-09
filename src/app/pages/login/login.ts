import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { GwCardComponent } from '../../shared/ui/display/card/card.component';
import { GwFormFieldComponent } from '../../shared/ui/forms/form-field/form-field.component';
import { GwInputComponent } from '../../shared/ui/forms/input/input.component';
import { GwPasswordInputComponent } from '../../shared/ui/forms/password-input/password-input.component';
import { GwButtonComponent } from '../../shared/ui/buttons/button/button.component';
import { GwAlertComponent } from '../../shared/ui/feedback/alert/alert.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    GwCardComponent,
    GwFormFieldComponent,
    GwInputComponent,
    GwPasswordInputComponent,
    GwButtonComponent,
    GwAlertComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['admin@sheetmetal.local', [Validators.required, Validators.email]],
    password: ['Admin@123', [Validators.required]],
  });
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Invalid email or password');
      },
    });
  }

  demo(which: 'admin' | 'sales'): void {
    this.form.patchValue(
      which === 'admin'
        ? { email: 'admin@sheetmetal.local', password: 'Admin@123' }
        : { email: 'sales@sheetmetal.local', password: 'Sales@123' },
    );
  }
}
