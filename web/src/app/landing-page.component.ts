import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-landing-page',
    imports: [RouterLink],
    templateUrl: './landing-page.component.html'
})
export class LandingComponent {
  constructor( private router: Router) {}

}

