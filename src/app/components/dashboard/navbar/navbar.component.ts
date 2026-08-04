import { Component, EventEmitter, Output, Input, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  @Input() pageTitle: string = 'Keep';

  @Output() menuClick = new EventEmitter<boolean>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() viewToggle = new EventEmitter<boolean>();

  @Output() refreshClick = new EventEmitter<void>();

  sidebarOpen = true;
  @Input() isGridView = true;
  isProfileOpen = false;
  isSpinning = false;
  isMobileSearchOpen = false;
  searchText = '';

  user: any = {};

  constructor(
    private userService: UserService,
    private router: Router,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {

    this.userService.getProfile().subscribe({

      next: (res: any) => {
        this.user = res.data;
      },

      error: (err: any) => {
        console.error('Profile Error', err);
      }

    });

  }

  menuToggle(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.menuClick.emit(this.sidebarOpen);
  }

  onSearchInput(event: any): void {
    this.searchText = event.target.value;
    this.searchChange.emit(this.searchText);
  }

  openMobileSearch(): void {
    this.isMobileSearchOpen = true;
  }

  closeMobileSearch(): void {
    this.isMobileSearchOpen = false;
    this.searchText = '';
    this.searchChange.emit('');
  }

  clearSearch(searchInput?: HTMLInputElement): void {
    this.searchText = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    this.searchChange.emit('');
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
    this.viewToggle.emit(this.isGridView);
  }

  refresh(): void {
    this.isSpinning = true;
    this.refreshClick.emit();
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  toggleProfileMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isProfileOpen = !this.isProfileOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const profileContainer = this.eRef.nativeElement.querySelector('.profile-container');
    if (profileContainer && !profileContainer.contains(target)) {
      this.isProfileOpen = false;
    }
  }

  addAccount(): void {

    this.isProfileOpen = false;

    this.router.navigate(['/register']);

  }

  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.isProfileOpen = false;

    this.router.navigate(['/login'], { queryParams: { signedOut: 'true' } });

  }

}