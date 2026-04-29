import { Injectable } from '@angular/core';
import { DecodedToken, RoleName, Permission, ROLE_PERMISSIONS } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Manages JWT token storage and retrieval from localStorage.
 *
 * SECURITY NOTE: Storing tokens in localStorage is a known tradeoff.
 * HttpOnly cookies would be more secure against XSS, but require server-side
 * cookie management and CSRF protection. localStorage is used here for
 * simplicity with a pure JWT/Bearer token API.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  setAccessToken(accessToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const decoded = this.getDecodedToken();
    if (!decoded) return false;

    // Check expiry with a 10-second buffer
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return decoded.exp > nowInSeconds + 10;
  }

  getDecodedToken(): DecodedToken | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      // Pad base64 string if needed
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      return decoded as DecodedToken;
    } catch {
      return null;
    }
  }

  getRoleName(): RoleName | null {
    return this.getDecodedToken()?.roleName ?? null;
  }

  getPermissions(): Permission[] {
    const role = this.getRoleName();
    if (!role) return [];
    return ROLE_PERMISSIONS[role] ?? [];
  }

  hasPermission(permission: Permission): boolean {
    return this.getPermissions().includes(permission);
  }
}
