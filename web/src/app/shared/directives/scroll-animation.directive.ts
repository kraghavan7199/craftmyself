import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appScrollAnimation]',
  standalone: true
})
export class ScrollAnimationDirective implements OnInit, OnDestroy, AfterViewInit {
  @Input() animationType: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' = 'fadeIn';
  @Input() delay: number = 0;
  @Input() threshold: number = 0.1;

  private observer!: IntersectionObserver;
  private hasAnimated = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Initially hide the element
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.setInitialTransform();
  }

  ngAfterViewInit() {
    this.createObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setInitialTransform() {
    const element = this.el.nativeElement;
    
    switch (this.animationType) {
      case 'slideUp':
        this.renderer.setStyle(element, 'transform', 'translateY(30px)');
        break;
      case 'slideLeft':
        this.renderer.setStyle(element, 'transform', 'translateX(-30px)');
        break;
      case 'slideRight':
        this.renderer.setStyle(element, 'transform', 'translateX(30px)');
        break;
      case 'scaleIn':
        this.renderer.setStyle(element, 'transform', 'scale(0.8)');
        break;
      default:
        // fadeIn doesn't need initial transform
        break;
    }
  }

  private createObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            setTimeout(() => {
              this.animateElement();
            }, this.delay);
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private animateElement() {
    const element = this.el.nativeElement;
    
    // Add transition
    this.renderer.setStyle(element, 'transition', 'all 0.6s ease-out');
    
    // Apply final styles
    this.renderer.setStyle(element, 'opacity', '1');
    
    switch (this.animationType) {
      case 'slideUp':
      case 'slideLeft':
      case 'slideRight':
        this.renderer.setStyle(element, 'transform', 'translate(0, 0)');
        break;
      case 'scaleIn':
        this.renderer.setStyle(element, 'transform', 'scale(1)');
        break;
      default:
        // fadeIn is handled by opacity change
        break;
    }
  }
}
