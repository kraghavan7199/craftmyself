import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { AuthState } from "../../store/state";

import { CommonModule } from "@angular/common";
import { selectLoading, selectLoadingMessage } from "../../store/selectors";



@Component({
    selector: 'app-loading',
    imports: [RouterOutlet, CommonModule],
    templateUrl: './loading.component.html'
})
  export class LoadingComponent { 
    loading$!: Observable<boolean>;
    loadingMessage$!: Observable<string | null>;

  constructor(private store: Store<{ auth: AuthState }>) { }

  ngOnInit(): void {
    this.loading$ = this.store.select(selectLoading);
    this.loadingMessage$ = this.store.select(selectLoadingMessage);
  }
  }