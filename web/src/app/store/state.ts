import { User } from "@angular/fire/auth";

export interface AuthState {
    user: any | null;
    error: any;
    exercises: any[];
    loading: boolean;
    loadingMessage : string| null;
  }
  
  export const initialState: AuthState = {
    user: null,
    error: null,
    exercises:[],
    loading: false,
    loadingMessage: ''
  };