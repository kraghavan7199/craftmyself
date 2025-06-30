import { Routes } from '@angular/router';

import { MasterPublicComponent } from './master-public.component';
import { AuthComponent } from './auth/auth.component';


export const PUBLIC_ROUTES: Routes = [
    {
        path: '',
        component: MasterPublicComponent,
        children: [
            {
                path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => AuthComponent)
            }
        ]
    }
];