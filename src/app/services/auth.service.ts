import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { map, catchError, retryWhen, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://fundo-notes-backend.onrender.com/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Render free-tier cold start fix:
   * status === 0 ka matlab backend abhi so raha hai (network unreachable).
   * 8 second baad automatically retry karo, max 2 baar.
   * Real server errors (4xx, 5xx) turant throw karo.
   */
  private withAutoRetry<T>(obs: Observable<T>): Observable<T> {
    return obs.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attempt) => {
            // Sirf network/connection error pe retry karo (status 0)
            if (error.status === 0 && attempt < 2) {
              return timer(8000); // 8 sec baad retry
            }
            return throwError(() => error);
          })
        )
      )
    );
  }

  /** Error message extract karo (server se jo bhi aaye) */
  private extractMessage(error: any, fallback: string): string {
    if (typeof error.error === 'string') return error.error;
    if (error.error?.message) return error.error.message;
    if (error.error?.error) return error.error.error;
    return fallback;
  }

  register(request: any): Observable<any> {
    return this.withAutoRetry(
      this.http.post<any>(`${this.apiUrl}/register`, request)
    ).pipe(
      catchError(error =>
        throwError(() => new Error(this.extractMessage(error, 'Registration failed')))
      )
    );
  }

  login(request: any): Observable<any> {
    return this.withAutoRetry(
      this.http.post<any>(`${this.apiUrl}/login`, request, { observe: 'response' })
    ).pipe(
      map((response: any) => {
        let token = response.body?.data;
        if (!token) {
          token = response.headers.get('Authorization')?.replace('Bearer ', '');
        }
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('currentUser', JSON.stringify(request));
        }
        return response.body;
      }),
      catchError(error =>
        throwError(() => new Error(this.extractMessage(error, 'Invalid Email or Password')))
      )
    );
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.withAutoRetry(
      this.http.post<any>(`${this.apiUrl}/verify-otp`, { email, otp })
    ).pipe(
      catchError(error =>
        throwError(() => new Error(this.extractMessage(error, 'OTP verification failed')))
      )
    );
  }

  resendOtp(email: string): Observable<any> {
    return this.withAutoRetry(
      this.http.post<any>(`${this.apiUrl}/resend-otp?email=${email}`, {})
    ).pipe(
      catchError(error =>
        throwError(() => new Error(this.extractMessage(error, 'Failed to resend OTP')))
      )
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.withAutoRetry(
      this.http.post<any>(`${this.apiUrl}/forgot-password-otp?email=${email}`, {})
    ).pipe(
      catchError(error =>
        throwError(() => new Error(this.extractMessage(error, 'Failed to send OTP')))
      )
    );
  }

  resetPassword(request: any): Observable<any> {
    return this.withAutoRetry(
      this.http.post<any>(`${this.apiUrl}/reset-password-otp`, {
        email: request.email,
        otp: request.otp,
        newPassword: request.password
      })
    ).pipe(
      catchError(error =>
        throwError(() => new Error(this.extractMessage(error, 'Password reset failed')))
      )
    );
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.post<any>(
      `${this.apiUrl}/logout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(response => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        return response;
      }),
      catchError(error =>
        throwError(() => new Error(this.extractMessage(error, 'Logout failed')))
      )
    );
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }

  getProfile() {
    return this.http.get(`${this.apiUrl}/profile`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}