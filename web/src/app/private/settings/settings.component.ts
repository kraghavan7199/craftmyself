import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { ToastService } from '../../services/toast.service';
import { Store } from '@ngrx/store';
import { selectUser } from '../../store/selectors';
import { User } from '../../shared/interfaces/User';
import moment from 'moment';

@Component({
    selector: 'app-settings',
    imports: [CommonModule],
    templateUrl: './settings.component.html'
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private toastService = inject(ToastService);
  private store = inject(Store);

  currentUserId: string = '';
  showLogoutModal = false;
  userProfile: User | null = null;
  isLoading = { 
    profile: false, 
    export: false 
  };

  ngOnInit() {
    this.setUserId();
  }

  setUserId() {
    this.store.select(selectUser).subscribe(user => {
      this.currentUserId = user.uid;
      this.loadUserProfile();
    });
  }

  loadUserProfile() {
    if (!this.currentUserId) return;
    
    this.isLoading.profile = true;
    this.firestoreService.getUserById(this.currentUserId).subscribe({
      next: (user) => {
        this.userProfile = user;
        this.isLoading.profile = false;
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
        this.isLoading.profile = false;

      }
    });
  }

  async exportData() {
    if (this.isLoading.export) return;
    
    this.isLoading.export = true;
    
    try {

      this.firestoreService.exportData(this.currentUserId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          const today = new Date().toISOString().split('T')[0];
          link.download = `user_${this.currentUserId}_export_${today}.json`;
          
          link.setAttribute('download', link.download);
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
        
          this.isLoading.export = false;
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.isLoading.export = false;
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      this.isLoading.export = false;
    }
  }

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  logout() {
    this.authService.logout();
  }

    convertFirestoreTime(date: any): any {
      if (date._seconds && date._nanoseconds)
        return moment(new Date(date._seconds * 1000 + date._nanoseconds / 1000000)).format('LLL');
    }
}