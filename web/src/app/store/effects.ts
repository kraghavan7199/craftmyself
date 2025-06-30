import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AuthActions from './actions';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FirestoreService } from "../services/firestore.service";


@Injectable()
export class AppEffects {

  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService); // Assuming FirestoreService is used for some reason
  private router = inject(Router);


  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      mergeMap(() =>
        from(this.authService.login()).pipe(
          map((userCredential) => {
            const { uid, email, displayName } = userCredential.user;
            this.firestoreService.createUserRecord(uid).subscribe();
            return AuthActions.loginSuccess({ user: { uid, email, displayName } });
          }),
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() =>  this.router.navigate(['/home']))
    ),
    { dispatch: false }
  );



}