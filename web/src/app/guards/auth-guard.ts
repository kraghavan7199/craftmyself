import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  CanMatchFn,
  Route,
  UrlSegment,
  CanActivateChildFn
} from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take, tap } from 'rxjs/operators';
import { selectUser } from '../store/selectors';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const store = inject(Store);

  const authService = inject(AuthService);

  return authService.user$.pipe(
    take(1),
    map(user => !!user),
    tap(isLoggedIn => {
      if (!isLoggedIn) {
        router.navigate(['/landing']);
      }
    })
  );

};