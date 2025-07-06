import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { PageWrapperComponent } from './shared/components/page-wrapper.component';
import { ScrollAnimationDirective } from './shared/directives/scroll-animation.directive';
import { slideUpAnimation, fadeInAnimation, slideInFromLeftAnimation } from './shared/animations/animations';

@Component({
    selector: 'app-landing-page',
    imports: [RouterLink, PageWrapperComponent, ScrollAnimationDirective],
    templateUrl: './landing-page.component.html',
    animations: [slideUpAnimation, fadeInAnimation, slideInFromLeftAnimation]
})
export class LandingComponent {
  constructor( private router: Router) {}

}

