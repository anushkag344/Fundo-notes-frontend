import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {

  EMAIL_PATTERN = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  OTP_PATTERN = '^[0-9]{4,6}$';
  PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$';

  email = '';
  otp = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.errorMessage = '';
    if (!this.email || !this.otp || !this.password || !this.confirmPassword) {
      this.errorMessage = 'All fields are required';
      return;
    }

    const emailRegex = new RegExp(this.EMAIL_PATTERN);
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    const otpRegex = new RegExp(this.OTP_PATTERN);
    if (!otpRegex.test(this.otp)) {
      this.errorMessage = 'Verification code must be 4-6 digits';
      return;
    }

    const passwordRegex = new RegExp(this.PASSWORD_PATTERN);
    if (!passwordRegex.test(this.password)) {
      this.errorMessage = 'Password must be min 8 chars with uppercase, lowercase & number';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    const resetReq = {
      email: this.email,
      otp: this.otp,
      password: this.password
    };
    this.authService.resetPassword(resetReq).subscribe({
      next: (res) => {
        this.successMessage = 'Password Reset Successfully!';
        setTimeout(() => { this.successMessage = ''; }, 3000);
        setTimeout(() => { this.router.navigate(['/login']); }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Password reset failed';
        setTimeout(() => { this.errorMessage = ''; }, 3000);
      }
    });
  }
}
