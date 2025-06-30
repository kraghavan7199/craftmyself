import { Routes } from '@angular/router';
import { LandingComponent } from './landing-page.component';
import { PUBLIC_ROUTES } from './public/master-public.routes';
import { authGuard } from './guards/auth-guard';
import { PRIVATE_ROUTES } from './private/master-private.routes';
import { guestGuard } from './guards/guest-guard';

export const routes: Routes = [
  {
    path: '', pathMatch: 'full', redirectTo: 'landing'
  },
  {
    path: '',
    canActivate: [authGuard],
    children: PRIVATE_ROUTES
  },
  {
    path: '',
    canActivate: [guestGuard],
    children: PUBLIC_ROUTES
  },
  {
    path: 'landing',
    component: LandingComponent,
    canActivate: [guestGuard]
  }
];
