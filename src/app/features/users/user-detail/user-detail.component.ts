import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal,
  DestroyRef
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TokenService } from '../../../core/services/token.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { User } from '../../../core/models/user.models';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly notification = inject(NotificationService);
  private readonly tokenService = inject(TokenService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(I18nService).lang;

  readonly loading = signal(true);
  readonly user = signal<User | null>(null);

  canEditUser(target: User): boolean {
    const current = this.tokenService.getDecodedToken();
    if (!current) return false;

    if (current.id === target.id) return true;

    const targetRole = target.role?.name;
    if (targetRole === 'superuser') return false;
    if (current.roleName === 'superuser') return true;
    if (current.roleName === 'admin') return targetRole === 'user';

    return false;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/users']);
      return;
    }

    const id = parseInt(idParam, 10);
    this.userService
      .getUserById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load user details.');
          this.loading.set(false);
          this.router.navigate(['/users']);
        }
      });
  }
}
