import { APP_INITIALIZER, ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { provideState, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { AppEffects } from './store/effects';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { authReducer } from './store/reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AppInitializerService } from './services/app-initializer.service';
import { AuthService } from './services/auth.service';
import { initializeApps } from './app-init';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideFunctions(() => getFunctions(getApp(), 'asia-south1')),

  provideStore(),
  provideEffects([AppEffects]),
  provideHttpClient(
    withInterceptorsFromDi()
  ),
  provideState({ name: 'auth', reducer: authReducer }),
  provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  {
    provide: APP_INITIALIZER, useFactory: initializeApps, multi: true, deps: [AppInitializerService, AuthService],
  },
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true, deps: [AuthService] }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })]
};
