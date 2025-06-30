import { createReducer, on } from "@ngrx/store";
import { initialState } from "./state";
import * as AuthActions from './actions';




export const authReducer = createReducer(
  initialState,
  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    error: null
  })),
  on(AuthActions.loadUserSuccess, (state, {user}) => ({
    ...state,
    user,
    error: null
  })),
   on(AuthActions.startLoading, (state, { message }) => ({
    ...state,
    loading: true,
    loadingMessage: message,
  })),
  on(AuthActions.stopLoading, state => ({
    ...state,
    loading: false,
    loadingMessage: null,
  }))
)  