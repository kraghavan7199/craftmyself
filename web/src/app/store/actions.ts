import { User } from "@angular/fire/auth";
import { createAction, props } from "@ngrx/store";


export const login = createAction(
    '[Auth] Login ');

export const loginSuccess = createAction(
    '[Auth] Login Success', 
    props<{ user: any | null }>());

export const loadUserSuccess = createAction(
    '[Auth] User Profile Loaded Success',
    props<{user : any | null}>()
);

export const startLoading = createAction(
    '[UI] Loading Start',
    props<{message: string}>()
)

export const stopLoading = createAction('[UI] Stop Loading');

export const logout = createAction('[Auth] Logout');
