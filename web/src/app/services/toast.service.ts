
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Toast, ToastType } from '../shared/interfaces/Toast';


@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new Subject<Toast>();
  public toasts$ = this.toastsSubject.asObservable();

  private createToast(message: string, type: ToastType) {
    const toast: Toast = {
      id: Date.now().toString() + Math.random().toString(36).substr(2),
      message,
      type
    };
    this.toastsSubject.next(toast);
  }

  success(message: string) { this.createToast(message, 'success'); }
  info(message: string)    { this.createToast(message, 'info'); }
  error(message: string)   { this.createToast(message, 'error'); }
}
