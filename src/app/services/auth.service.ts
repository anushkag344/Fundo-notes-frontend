import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://fundo-notes-backend.onrender.com/api/users';

  constructor(private http: HttpClient) {}
  register(request: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/register`,
      request
    ).pipe(
      catchError((error) => {
        let message = 'Registration failed';
        if (error.status === 0) {
          message = 'Backend Server (port 8080) connect nahi ho raha. Kripya Backend start karein!';
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.error?.error) {
          message = error.error.error;
        }
        return throwError(() => new Error(message));
      })
    );
  }
  login(request: any): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/login`,
      request,
      { observe: 'response' }
    ).pipe(

      map((response: any) => {

        let token = response.body?.data;
        if (!token) {
          token = response.headers
            .get('Authorization')
            ?.replace('Bearer ', '');
        }

        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem(
            'currentUser',
            JSON.stringify(request)
          );
        }

        return response.body;

      }),

      catchError((error) => {
        let message = 'Login failed';
        if (error.status === 0) {
          message = 'Backend Server (port 8080) connect nahi ho raha. Kripya Backend start karein!';
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.error?.error) {
          message = error.error.error;
        }
        return throwError(() => new Error(message));
      })
    );
  }
  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/verify-otp`,
      { email, otp }
    ).pipe(
      catchError((error) => {
        let message = 'OTP verification failed';
        if (error.status === 0) {
          message = 'Backend Server (port 8080) connect nahi ho raha.';
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.error?.error) {
          message = error.error.error;
        }
        return throwError(() => new Error(message));
      })
    );
  }
  resendOtp(email: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/resend-otp?email=${email}`,
      {}
    ).pipe(
      catchError((error) => {
        let message = 'Failed to resend OTP';
        if (error.status === 0) {
          message = 'Backend Server (port 8080) connect nahi ho raha.';
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.error?.error) {
          message = error.error.error;
        }
        return throwError(() => new Error(message));
      })
    );
  }
  forgotPassword(email: string): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/forgot-password-otp?email=${email}`,
      {}
    ).pipe(
      catchError((error) => {
        let message = 'Failed to send OTP';
        if (error.status === 0) {
          message = 'Backend Server (port 8080) connect nahi ho raha.';
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.error?.error) {
          message = error.error.error;
        }
        return throwError(() => new Error(message));
      })
    );
  }
  resetPassword(request: any): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/reset-password-otp`,
      {
        email: request.email,
        otp: request.otp,
        newPassword: request.password
      }
    ).pipe(
      catchError((error) => {
        let message = 'Password reset failed';
        if (error.status === 0) {
          message = 'Backend Server (port 8080) connect nahi ho raha.';
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.error?.error) {
          message = error.error.error;
        }
        return throwError(() => new Error(message));
      })
    );
  }
  logout(): Observable<any> {

    const token = localStorage.getItem('token');

    return this.http.post<any>(
      `${this.apiUrl}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).pipe(
      map((response) => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        return response;
      }),
      catchError((error) => {
        const message =
          error.error?.message ||
          error.error?.error ||
          'Logout failed';

        return throwError(() => new Error(message));
      })
    );
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }
  getProfile() {
  return this.http.get('http://localhost:8080/api/users/profile', {
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('token')
    }
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