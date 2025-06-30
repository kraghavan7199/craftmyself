import { Injectable } from "@angular/core";
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { catchError, filter, first, firstValueFrom, map, of, take, tap } from 'rxjs';
import { AuthService } from "./auth.service";
import { selectUser } from "../store/selectors";
import { loadUserSuccess, loginSuccess } from "../store/actions";


@Injectable({
    providedIn: 'root'
  })
  export class AppInitializerService {
    constructor(
      private store: Store,
      private router: Router,
      private authService: AuthService
    ) {}
  
    async initializeApp(): Promise<void> {
        try {
   
          const user = await firstValueFrom(
            this.authService.user$.pipe(take(1))
          );
          
          const isLoggedIn = !!user;
          if (isLoggedIn) {
           this.store.dispatch(loadUserSuccess({ user: { name: user.displayName, email: user.email, uid: user.uid} }));
          } else {
            await this.router.navigate(['/landing']);
          }
           
        }catch (error) {
            console.error('App initialization failed:', error);
            await this.router.navigate(['/landing']);
          }
    }
}