// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { retry, switchMap, take, timeout } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {


  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.user$.pipe(
      take(1),                      
      switchMap(user => {
        if (!user) {

          return next.handle(req);
        }

        return from(user.getIdToken()).pipe(
          switchMap(token => {
            const authReq = req.clone({
              setHeaders: { Authorization: `Bearer ${token}` }
            });
            return next.handle(authReq).pipe( timeout(3000), retry(1));
          })
        );
      })
    );
  }
}
