import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TokenService } from '../services/token.service';
import { Permission } from '../models/auth.models';

/**
 * Protects routes based on permissions.
 * Usage in route config:
 *   canActivate: [roleGuard],
 *   data: { permissions: ['users:read'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const requiredPermissions = (route.data['permissions'] as Permission[]) ?? [];

  if (requiredPermissions.length === 0) {
    return true;
  }

  const hasAll = requiredPermissions.every((p) => tokenService.hasPermission(p));

  if (hasAll) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
