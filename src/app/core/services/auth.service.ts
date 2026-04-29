import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  UserInfo
} from '../models/auth.models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  private readonly apiUrl = environment.apiUrl;

  private readonly currentUserSubject = new BehaviorSubject<UserInfo | null>(
    this.loadUserFromStorage()
  );

  /** Emits the currently authenticated user, or null when logged out. */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          this.storeUser(response.user);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http
      .post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.tokenService.setAccessToken(response.accessToken);
        })
      );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    const accessToken = this.tokenService.getAccessToken();

    // Fire-and-forget logout call — clean up local state regardless of server response
    if (accessToken && refreshToken) {
      this.http
        .post(
          `${this.apiUrl}/auth/logout`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        .subscribe({ error: () => {} });
    }

    this.clearSession();
  }

  clearSession(): void {
    this.tokenService.clearTokens();
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }

  private storeUser(user: UserInfo): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  private loadUserFromStorage(): UserInfo | null {
    try {
      const raw = localStorage.getItem('current_user');
      return raw ? (JSON.parse(raw) as UserInfo) : null;
    } catch {
      return null;
    }
  }
}
