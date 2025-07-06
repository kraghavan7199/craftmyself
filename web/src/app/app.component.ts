import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeTransitionAnimation } from './shared/animations/animations';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    animations: [routeTransitionAnimation]
})
export class AppComponent {
  title = 'craftmyself';

  getRouteAnimationData() {
    // This can be enhanced to return different values based on current route
    return 'page';
  }
}
