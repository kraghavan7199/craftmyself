import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { LoadingComponent } from "../shared/components/loading.component";
import { ToastComponent } from "../shared/components/toast.component";
import { ToastService } from "../services/toast.service";
import { Toast } from "../shared/interfaces/Toast";
import { CommonModule } from "@angular/common";





@Component({
    selector: 'app-private',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingComponent, CommonModule, ToastComponent],
    templateUrl: './master-private.component.html'
})
export class MasterPrivateComponent {
  toasts: Toast[] = [];

  constructor(private authService: AuthService, private toastService: ToastService) { }

  ngOnInit() {
    this.toastService.toasts$.subscribe(toast => {
      this.toasts.push(toast);
    });
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}