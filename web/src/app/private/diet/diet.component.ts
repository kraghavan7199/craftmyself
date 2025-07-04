import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterOutlet } from "@angular/router";
import { FirestoreService } from "../../services/firestore.service";
import { Timestamp } from "@angular/fire/firestore";
import { Store } from "@ngrx/store";
import { selectUser } from "../../store/selectors";
import { Macros } from "../../shared/interfaces/UserMacros";
import { ToastService } from "../../services/toast.service";
import { v4 as uuidv4 } from 'uuid';

@Component({
    selector: 'app-diet',
    imports: [RouterOutlet, FormsModule, ReactiveFormsModule, CommonModule],
    templateUrl: './diet.component.html'
})
export class DietComponent {
  foodQuery: string = '';
  dietForm!: FormGroup;
  todaysDate: Date = new Date();
  macroSearchData = [] as any;
  dailyMacros = [] as any;
  currentUserId: string = '';
  todaysMacrosData: any;
  isLoading = { searchData: false, macroLog: false}
  
  totals: any;
  isAiMode: any;


  constructor(private firestoreService: FirestoreService, private store: Store, private fb: FormBuilder, private toast: ToastService) {
    this.foodQuery = '';
    this.dietForm = this.fb.group({
      food_item: ['', Validators.required],
      quantity: ['', Validators.required],
      calories: ['', Validators.required],
      proteins: ['', Validators.required],
      carbs: ['', Validators.required],
      fats: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.isLoading.macroLog = true;
    this.setUserId();
  }

  setUserId() {
    this.store.select(selectUser).subscribe(user => {
      this.currentUserId = user.uid;
      this.getTodaysMacros();
    })
  }

  onSearch(): void {
    try {
      const query = this.foodQuery.trim();
      if (!query) {
        return;
      }
      this.isLoading.searchData = true;
      this.firestoreService.calculateMacros(query).subscribe((response: any) => {
        this.macroSearchData = response;
        this.isLoading.searchData = false;
      })
    } catch (err) {
      this.isLoading.searchData = false;
      //TODO Error Handling
    }
  }

  addMacros() {
    try {
      if (!this.isAiMode && !this.dietForm.valid) {
        this.toast.info('Enter Valid Values!')
        return;
      }
      this.todaysMacrosData.userId = this.currentUserId;
      if (!this.dailyMacros.length) {
        this.todaysMacrosData.date = new Date();

        this.todaysMacrosData.macros = this.isAiMode ? this.macroSearchData : [this.getDietEntry()];
        this.firestoreService.addMacros(this.todaysMacrosData).subscribe(_ => {
          this.cancelSearch();
          this.todaysMacrosData = {};
          this.dailyMacros = [];
          this.dietForm.reset();
          this.getTodaysMacros();
        })
        return
      }
      this.todaysMacrosData.macros = this.isAiMode ? [...this.dailyMacros, ...this.macroSearchData] : [...this.dailyMacros, this.getDietEntry()];
      this.firestoreService.updateMacros(this.todaysMacrosData.id, this.todaysMacrosData).subscribe(_ => {
        this.cancelSearch();
        this.todaysMacrosData = {};
        this.dailyMacros = [];
        this.dietForm.reset();
        this.getTodaysMacros();
      })
    } catch (e) {
      this.toast.error('Error Adding Macros')
    }


  }

  getDietEntry() {
    return {
      food_item: this.dietForm.get('food_item')?.value,
      quantity: this.dietForm.get('quantity')?.value,
      kcal: this.dietForm.get('calories')?.value,
      protein_g: this.dietForm.get('proteins')?.value,
      carbs_g: this.dietForm.get('carbs')?.value,
      fats_g: this.dietForm.get('fats')?.value,
      id: uuidv4()
    }
  }

  cancelSearch() {
    this.foodQuery = '';
    this.macroSearchData = [];
  }

  getTodaysMacros() {
    try {
      this.isLoading.macroLog = true;
      this.firestoreService.getCurrentDayMacros(this.currentUserId).subscribe((macrosData: any) => {
        this.todaysMacrosData = macrosData;
        if (this.todaysMacrosData) {
          this.dailyMacros = (this.todaysMacrosData.macros || []);
          this.calculateTotals();
        } else {
          this.dailyMacros = [];
          this.todaysMacrosData = {} as Macros;
        }
        this.isLoading.macroLog = false;
      });
    } catch (err) {
      this.isLoading.macroLog = false;
      // TODO Error
    }
  }

  deleteSearchItem(macro: any) {
    this.macroSearchData = this.macroSearchData.filter((item: any) => item.id !== macro.id);

    if (!this.macroSearchData.length) {
      this.cancelSearch();
    }
  }

  deleteMacro(macro: any) {
    try {
      this.dailyMacros = this.dailyMacros.filter((item: any) => item.id !== macro.id);
      this.todaysMacrosData.macros = this.dailyMacros;
      if (!this.todaysMacrosData.macros.length) {
        this.firestoreService.deleteUserMacros(this.todaysMacrosData.id).subscribe(_ => {
          this.todaysMacrosData = {};
          this.dailyMacros = [];
        })
      }
      else {
        this.todaysMacrosData.userId = this.currentUserId;
        this.firestoreService.updateMacros(this.todaysMacrosData.id, this.todaysMacrosData).subscribe(_ => {
          this.getTodaysMacros();
        })
      }
    } catch (e) {
      // TODO Error Handling
    }
  }

  calculateTotals(): void {
    this.totals = this.dailyMacros.reduce((acc: any, item: any) => {
      return {
        kcal: acc.kcal + +item.kcal,
        protein_g: acc.protein_g + +item.protein_g,
        carbs_g: acc.carbs_g + +item.carbs_g,
        fats_g: acc.fats_g + +item.fats_g
      };
    }, {
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fats_g: 0
    });
  }

}