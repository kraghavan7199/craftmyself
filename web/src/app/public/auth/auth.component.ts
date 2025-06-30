import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { login } from "../../store/actions";
import { Store } from '@ngrx/store';
import { AuthState } from "../../store/state";




@Component({
    selector: 'app-auth',
    imports: [RouterLink],
    templateUrl: './auth.component.html'
})
  export class AuthComponent { 
    
    constructor( private store: Store<{ auth: AuthState }>){}

    login() {
      this.store.dispatch(login());
    }
   
  }