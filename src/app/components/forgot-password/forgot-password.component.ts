import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  EMAIL_PATTERN = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

  email = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  sendReset() {

    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Email is required';
      return;
    }

    const emailRegex = new RegExp(this.EMAIL_PATTERN);
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.authService.forgotPassword(this.email).subscribe({

      next: () => {
        this.successMessage = 'OTP Sent Successfully! Check your email.';
        setTimeout(() => { this.successMessage = ''; }, 3000);
        setTimeout(() => { this.router.navigate(['/reset-password']); }, 1500);
      },

      error: (err) => {
        this.errorMessage =
          err.message ||
          'Verification request failed';
        setTimeout(() => { this.errorMessage = ''; }, 3000);
      }

    });

  }

}