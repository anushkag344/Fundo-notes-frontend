import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  EMAIL_PATTERN = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

  credentials = {
    email: '',
    password: ''
  };

  submitted = false;

  showPassword = false;
  isLoading = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      if (params['token']) {
        localStorage.setItem('token', params['token']);
        this.router.navigate(['/dashboard']);
      }

      if (params['error']) {
        this.errorMessage = params['error'];
        setTimeout(() => { this.errorMessage = ''; }, 3000);
      }

      if (params['signedOut'] === 'true') {
        this.successMessage = 'Signed Out Successfully!';
        setTimeout(() => { this.successMessage = ''; }, 3000);
      }

    });

  }

  onSubmit() {

    this.submitted = true;
    this.errorMessage = '';

    if (!this.credentials.email || !this.credentials.password) {
      return;
    }

    const emailRegex = new RegExp(this.EMAIL_PATTERN);

    if (!emailRegex.test(this.credentials.email)) {
      return;
    }

    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({

      next: (res: any) => {

        if (res.data) {
          localStorage.setItem('token', res.data);
        }

        this.successMessage = 'Login Successful';
        setTimeout(() => { this.successMessage = ''; }, 3000);
        setTimeout(() => {
          this.router.navigate(['/dashboard']).then(() => {
            this.isLoading = false;
          }).catch(() => {
            this.isLoading = false;
          });
        }, 1000);

      },

      error: (err: any) => {

        this.isLoading = false;
        this.errorMessage =
          err.error?.message || 'Invalid Email or Password';
        setTimeout(() => { this.errorMessage = ''; }, 3000);

      }

    });

  }

}