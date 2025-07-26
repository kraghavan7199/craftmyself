
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Toast, ToastType } from '../shared/interfaces/Toast';


@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new Subject<Toast>();
  public toasts$ = this.toastsSubject.asObservable();

  private createToast(message: string, type: ToastType, duration: number = 5000) {
    const toast: Toast = {
      id: Date.now().toString() + Math.random().toString(36).substr(2),
      message,
      type,
      duration
    };
    this.toastsSubject.next(toast);
  }

  success(message: string, duration?: number) { this.createToast(message, 'success', duration); }
  info(message: string, duration?: number)    { this.createToast(message, 'info', duration); }
  error(message: string, duration?: number)   { this.createToast(message, 'error', duration); }
  warning(message: string, duration?: number) { this.createToast(message, 'warning', duration); }
}
