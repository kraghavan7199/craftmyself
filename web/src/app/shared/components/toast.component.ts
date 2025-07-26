import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../interfaces/Toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-sm transform transition-all duration-300 ease-in-out animate-slide-in hover:scale-105"
      [ngClass]="{
        'bg-yellow-500/90 border-yellow-400/30 text-white': toast.type === 'info',
        'bg-green-500/90 border-green-400/30 text-white': toast.type === 'success',
        'bg-red-500/90 border-red-400/30 text-white': toast.type === 'error',
        'bg-orange-500/90 border-orange-400/30 text-white': toast.type === 'warning'
      }"
    >
      <!-- Icon -->
      <div class="flex-shrink-0 mr-3">
        <div 
          class="w-5 h-5 rounded-full flex items-center justify-center bg-white/20 text-white"
        >
          <!-- Success Icon -->
          <svg *ngIf="toast.type === 'success'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          
          <!-- Error Icon -->
          <svg *ngIf="toast.type === 'error'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
          
          <!-- Warning Icon -->
          <svg *ngIf="toast.type === 'warning'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
              <!-- Info Icon -->
        <svg *ngIf="toast.type === 'info'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        </div>
      </div>

      <!-- Message Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium leading-5">{{ toast.message }}</p>
      </div>

      <!-- Close Button -->
      <button
        (click)="onClose()"
        class="flex-shrink-0 ml-3 inline-flex items-center justify-center w-6 h-6 rounded-md text-white/70 hover:text-white hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2"
        aria-label="Close notification"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `
})
export class ToastComponent implements OnInit {
  @Input() toast!: Toast;
  @Output() close = new EventEmitter<string>();

  ngOnInit() {
    // Auto-close after specified duration
    if (this.toast.duration && this.toast.duration > 0) {
      setTimeout(() => {
        this.onClose();
      }, this.toast.duration);
    }
  }

  onClose() {
    this.close.emit(this.toast.id);
  }
}
