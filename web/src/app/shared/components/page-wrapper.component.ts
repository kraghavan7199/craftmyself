import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fadeInAnimation, slideUpAnimation } from '../animations/animations';

@Component({
  selector: 'app-page-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [@fadeIn] 
      [ngClass]="containerClass"
      class="min-h-screen"
    >
      <ng-content></ng-content>
    </div>
  `,
  animations: [fadeInAnimation, slideUpAnimation]
})
export class PageWrapperComponent implements OnInit {
  @Input() containerClass: string = '';
  @Input() animationType: 'fade' | 'slideUp' = 'fade';

  ngOnInit() {
    // Component initialization complete
  }
}
