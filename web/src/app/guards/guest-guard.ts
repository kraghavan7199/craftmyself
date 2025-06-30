import { inject } from '@angular/core';
import {
    CanActivateFn,
    Router
} from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {

    const router = inject(Router);

    const store = inject(Store);

    const authService = inject(AuthService);

    return authService.user$.pipe(
        take(1),
        map(user => {
            const isLoggedIn = !!user;
            if (isLoggedIn) {
                router.navigate(['/home']);
                return false;
            }
            return true;
        })
    );

};