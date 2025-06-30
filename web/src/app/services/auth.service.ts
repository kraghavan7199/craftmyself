import { inject, Injectable } from "@angular/core";
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, User, user } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { loginSuccess } from "../store/actions";


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    auth: Auth = inject(Auth);
    private provider = new GoogleAuthProvider();
    user$: Observable<User | null> = user(this.auth);

    constructor(private router: Router, private store: Store,) { }

    login() {
        return signInWithPopup(this.auth, this.provider)
    }

    getUserObservable() {
        return this.user$;
    }

    getUser(): User | null {
        return this.auth.currentUser;
    }

    logout() {
        signOut(this.auth).then(() => {
            this.router.navigate(['landing']);
        }).catch(err => console.error(err))
    }

}