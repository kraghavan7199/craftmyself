import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './state';


const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
    selectAuthState,
    (state) => state.user
  );

  export const selectLoading = createSelector(
  selectAuthState,
  state => state.loading
);

export const selectLoadingMessage = createSelector(
  selectAuthState,
  state => state.loadingMessage
);