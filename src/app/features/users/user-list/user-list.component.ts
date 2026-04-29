import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TokenService } from '../../../core/services/token.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { User } from '../../../core/models/user.models';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    HasPermissionDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notification = inject(NotificationService);
  private readonly tokenService = inject(TokenService);
  readonly lang = inject(I18nService).lang;
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly users = signal<User[]>([]);
  readonly totalUsers = signal(0);
  readonly pageSize = signal(10);
  readonly currentPage = signal(0);

  readonly displayedColumns = ['name', 'email', 'role', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService
      .getUsers(this.currentPage() + 1, this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          // If API returns a flat array without pagination metadata,
          // set total to loaded count (server may paginate differently)
          this.totalUsers.set(users.length < this.pageSize() ?
            this.currentPage() * this.pageSize() + users.length :
            (this.currentPage() + 2) * this.pageSize()
          );
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load users.');
          this.loading.set(false);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  getAvatarColor(name: string): string {
    const index = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  canEditUser(target: User): boolean {
    const current = this.tokenService.getDecodedToken();
    if (!current) return false;

    // Siempre puede editar su propio perfil
    if (current.id === target.id) return true;

    const targetRole = target.role?.name;

    // Nadie puede editar a otro superuser
    if (targetRole === 'superuser') return false;

    // Superuser puede editar user y admin ajenos
    if (current.roleName === 'superuser') return true;

    // Admin solo puede editar rol user ajeno
    if (current.roleName === 'admin') return targetRole === 'user';

    // User no puede editar perfiles ajenos
    return false;
  }

  canDeleteUser(target: User): boolean {
    const current = this.tokenService.getDecodedToken();
    if (!current) return false;

    // Nadie puede eliminarse a sí mismo
    if (current.id === target.id) return false;

    const targetRole = target.role?.name;

    // Superuser nunca puede ser eliminado
    if (targetRole === 'superuser') return false;

    // Superuser puede eliminar user y admin
    if (current.roleName === 'superuser') return true;

    // Admin solo puede eliminar rol user
    if (current.roleName === 'admin') return targetRole === 'user';

    return false;
  }

  confirmDelete(user: User): void {
    const data: ConfirmDialogData = {
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    };

    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '400px' });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.deleteUser(user.id);
        }
      });
  }

  private deleteUser(id: number): void {
    this.loading.set(true);
    this.userService
      .deleteUser(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notification.success('User deleted successfully.');
          this.loadUsers();
        },
        error: () => {
          this.notification.error('Failed to delete user.');
          this.loading.set(false);
        }
      });
  }
}
