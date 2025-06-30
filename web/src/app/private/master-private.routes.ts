import { Routes } from "@angular/router";
import { MasterPrivateComponent } from "./master-private.component";
import { authGuard } from "../guards/auth-guard";
import { inject } from "@angular/core";




export const PRIVATE_ROUTES: Routes = [

    {
        path: '',
        component: MasterPrivateComponent,
        children: [
            {
                path: 'home',
                loadComponent: () =>
                    import('./home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'analytics',
                loadComponent: () => import('./analytics/analytics.component').then(m => m.AnalyticsComponent)
            },
            {
                path: 'diet',
                loadComponent: () => import('./diet/diet.component').then(m => m.DietComponent)
            },      
            {
                path: 'workout-plan',
                loadComponent: () => import('./workout-plan/workout-plan.component').then(m => m.WorkoutPlanComponent)
            },
              {
                path: 'blueprint',
                loadComponent: () => import('./blueprint/blueprint.component').then(m => m.BlueprintComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
            }
        ]

    }
]