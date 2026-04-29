import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal,
  DestroyRef
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { User } from '../../core/models/user.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  readonly tokenService = inject(TokenService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(I18nService).lang;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly hidePassword = signal(true);
  readonly profile = signal<User | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]]
  });

  ngOnInit(): void {
    const decoded = this.tokenService.getDecodedToken();
    if (!decoded) return;

    this.userService
      .getUserById(decoded.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.profile.set(user);
          this.form.patchValue({ name: user.name, email: user.email });
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load profile.');
          this.loading.set(false);
        }
      });
  }

  startEditing(): void {
    this.editing.set(true);
  }

  cancelEditing(): void {
    const user = this.profile();
    if (user) {
      this.form.patchValue({ name: user.name, email: user.email, password: '' });
    }
    this.form.markAsPristine();
    this.editing.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const userId = this.profile()?.id;
    if (!userId) return;

    this.saving.set(true);
    this.form.disable();

    const { name, email, password } = this.form.getRawValue();
    const payload: Record<string, unknown> = { name: name!, email: email! };
    if (password) payload['password'] = password;

    this.userService
      .updateUser(userId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser) => {
          this.profile.set(updatedUser);
          this.form.patchValue({ password: '' });
          this.saving.set(false);
          this.editing.set(false);
          this.form.enable();
          this.notification.success('Profile updated successfully.');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.form.enable();
          this.notification.error(err.error?.message ?? 'Failed to update profile.');
        }
      });
  }

  getFieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return `${this.capitalize(field)} is required`;
    if (ctrl.hasError('email')) return 'Enter a valid email address';
    if (ctrl.hasError('minlength')) {
      const min = ctrl.errors?.['minlength']?.requiredLength;
      return `Must be at least ${min} characters`;
    }
    return '';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
