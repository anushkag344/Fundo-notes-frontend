import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  NAME_PATTERN = '^[A-Z][a-zA-Z]{2,}$';
  EMAIL_PATTERN = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$';

  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // mobileNumber: ''
  };

  showPassword = false;
  errorMessage = '';
  successMessage = '';
  submitted = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(form: any) {

    this.submitted = true;
    this.errorMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    const regRequest = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      password: this.user.password
    };

    this.authService.register(regRequest).subscribe({

      next: (res) => {
        this.successMessage = 'Registration Successful!';
        setTimeout(() => { this.successMessage = ''; }, 3000);
        setTimeout(() => { this.router.navigate(['/login']); }, 1500);
      },

      error: (err) => {
        const rawMsg: string = (err.error?.message || err.message || 'Registration failed').toLowerCase();
        if (rawMsg.includes('already') || rawMsg.includes('exist') || rawMsg.includes('duplicate')) {
          this.errorMessage = 'User Already Registered!';
        } else {
          this.errorMessage = err.error?.message || err.message || 'Registration failed';
        }
        setTimeout(() => { this.errorMessage = ''; }, 3000);
      }

    });

  }

} 