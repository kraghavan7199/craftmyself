import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { login } from "../../store/actions";
import { Store } from '@ngrx/store';
import { AuthState } from "../../store/state";
import { PageWrapperComponent } from "../../shared/components/page-wrapper.component";
import { ScrollAnimationDirective } from "../../shared/directives/scroll-animation.directive";
import { scaleInAnimation, slideUpAnimation, fadeInAnimation } from "../../shared/animations/animations";

@Component({
    selector: 'app-auth',
    imports: [RouterLink, PageWrapperComponent, ScrollAnimationDirective],
    templateUrl: './auth.component.html',
    animations: [scaleInAnimation, slideUpAnimation, fadeInAnimation]
})
  export class AuthComponent { 
    
    constructor( private store: Store<{ auth: AuthState }>){}

    login() {
      this.store.dispatch(login());
    }
   
  }