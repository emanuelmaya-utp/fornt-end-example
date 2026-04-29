import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal,
  DestroyRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TokenService } from '../../../core/services/token.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { RoleName } from '../../../core/models/auth.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly notification = inject(NotificationService);
  readonly tokenService = inject(TokenService);
  readonly lang = inject(I18nService).lang;
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly hidePassword = signal(true);
  readonly userId = signal<number | null>(null);

  get isEditMode(): boolean {
    return this.userId() !== null;
  }

  readonly availableRoles: { value: RoleName; label: string }[] = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
    { value: 'superuser', label: 'Superuser' }
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    roleName: ['user' as RoleName]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.userId.set(id);
      // Password not required on edit
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.loadUser(id);
    } else {
      // Password required on create
      this.form.get('password')?.addValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  private loadUser(id: number): void {
    this.loading.set(true);
    this.userService
      .getUserById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.form.patchValue({
            name: user.name,
            email: user.email,
            roleName: user.role?.name as RoleName
          });
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load user data.');
          this.loading.set(false);
          this.router.navigate(['/users']);
        }
      });
  }

  getFieldError(field: string): string {
    const ctrl: AbstractControl | null = this.form.get(field);
    if (!ctrl || !ctrl.touched) return '';

    if (ctrl.hasError('required')) return `${this.capitalize(field)} is required`;
    if (ctrl.hasError('email')) return 'Enter a valid email address';
    if (ctrl.hasError('minlength')) {
      const min = ctrl.errors?.['minlength']?.requiredLength;
      return `Must be at least ${min} characters`;
    }
    if (ctrl.hasError('maxlength')) {
      const max = ctrl.errors?.['maxlength']?.requiredLength;
      return `Must be no more than ${max} characters`;
    }
    return '';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.form.disable();

    const { name, email, password, roleName } = this.form.getRawValue();

    if (this.isEditMode) {
      const payload: Record<string, unknown> = { name: name!, email: email! };
      if (password) payload['password'] = password;
      if (this.tokenService.hasPermission('admins:create')) {
        payload['roleName'] = roleName;
      }

      this.userService
        .updateUser(this.userId()!, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.notification.success('User updated successfully.');
            this.router.navigate(['/users', this.userId()]);
          },
          error: (err: HttpErrorResponse) => {
            this.saving.set(false);
            this.form.enable();
            this.notification.error(err.error?.message ?? 'Failed to update user.');
          }
        });
    } else {
      const payload: Record<string, unknown> = { name: name!, email: email!, password: password! };
      if (this.tokenService.hasPermission('admins:create')) {
        payload['roleName'] = roleName;
      }

      this.userService
        .createUser(payload as never)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (user) => {
            this.saving.set(false);
            this.notification.success('User created successfully.');
            this.router.navigate(['/users', user.id]);
          },
          error: (err: HttpErrorResponse) => {
            this.saving.set(false);
            this.form.enable();
            this.notification.error(err.error?.message ?? 'Failed to create user.');
          }
        });
    }
  }

  cancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/users', this.userId()]);
    } else {
      this.router.navigate(['/users']);
    }
  }
}
