import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationSetupService {
  
  /**
   * Apply basic page load animations to elements
   * @param element - The element to animate
   * @param animationType - The type of animation to apply
   * @param delay - Delay in milliseconds
   */
  applyPageLoadAnimation(element: HTMLElement, animationType: string = 'fadeIn', delay: number = 0) {
    element.style.opacity = '0';
    element.style.transform = this.getInitialTransform(animationType);
    
    setTimeout(() => {
      element.style.transition = 'all 0.6s ease-out';
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0) scale(1)';
    }, delay);
  }

  /**
   * Apply staggered animations to a list of elements
   * @param elements - Array of elements to animate
   * @param animationType - The type of animation to apply
   * @param staggerDelay - Delay between each element animation
   */
  applyStaggeredAnimation(elements: HTMLElement[], animationType: string = 'slideUp', staggerDelay: number = 100) {
    elements.forEach((element, index) => {
      this.applyPageLoadAnimation(element, animationType, index * staggerDelay);
    });
  }

  /**
   * Add hover animations to an element
   * @param element - The element to add hover animations to
   */
  addHoverAnimations(element: HTMLElement) {
    element.style.transition = 'transform 0.2s ease-in-out';
    
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.05)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
    });
  }

  private getInitialTransform(animationType: string): string {
    switch (animationType) {
      case 'slideUp':
        return 'translateY(30px)';
      case 'slideDown':
        return 'translateY(-30px)';
      case 'slideLeft':
        return 'translateX(-30px)';
      case 'slideRight':
        return 'translateX(30px)';
      case 'scaleIn':
        return 'scale(0.8)';
      default:
        return 'translate(0, 0)';
    }
  }
}
