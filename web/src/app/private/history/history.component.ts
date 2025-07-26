import { Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Store } from "@ngrx/store";
import { FirestoreService } from "../../services/firestore.service";
import { selectUser } from "../../store/selectors";
import moment from 'moment';
import { Timestamp } from "@angular/fire/firestore";
import { CommonModule } from "@angular/common";
import { CalendarHistoryComponent } from "../analytics/components/calendar-history.component";
import { PageWrapperComponent } from "../../shared/components/page-wrapper.component";

@Component({
  selector: 'app-history',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    CalendarHistoryComponent,
    PageWrapperComponent
  ],
  templateUrl: './history.component.html'
})
export class HistoryComponent {
  activeHistoryTab: string = 'workout';
  currentUserId: any;
  userWorkoutHistory = [] as any;
  userMacrosHistory = [] as any;
  isLoading = {
    workoutHistory: false,
    macrosHistory: false
  };
  limit = 31;
  skip = 0;
  workoutStartDate: Date | null = null;
  workoutEndDate: Date | null = null;
  macrosStartDate: Date | null = null;
  macrosEndDate: Date | null = null;
  muscleGroups = [
    { code: 'chest', name: 'Chest' }, 
    { code: 'back', name: 'Back' }, 
    { code: 'legs', name: 'Legs' },
    { code: 'shoulders', name: 'Shoulders' }, 
    { code: 'biceps', name: 'Biceps' }, 
    { code: 'triceps', name: 'Triceps' },
    { code: 'core', name: 'Core' }, 
    { code: 'forearms', name: 'Forearms' }
  ];

  setActiveHistoryTab(tab: string): void {
    this.activeHistoryTab = tab;
  }

  constructor(private store: Store, private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    this.setUserId();
  }

  setUserId() {
    this.store.select(selectUser).subscribe(user => {
      if (user && user.uid) {
        this.currentUserId = user.uid;
        this.initializeCalendarView();
      }
    });
  }

  private initializeCalendarView() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.onCalendarMonthChanged({ startDate: startOfMonth, endDate: endOfMonth });
  }

  getUserWorkoutHistory() {
    try {
      this.isLoading.workoutHistory = true;
      this.firestoreService.getUserWorkoutHistory(this.currentUserId, this.limit, this.skip, this.workoutStartDate, this.workoutEndDate).subscribe((userWorkoutHistory: any) => {
        this.userWorkoutHistory = userWorkoutHistory.userWorkouts;
        this.isLoading.workoutHistory = false;
      });
    } catch (err) {
      this.isLoading.workoutHistory = false;
      //TODO Error Handling
    }
  }

  getUserMacrosHistory() {
    try {
      this.isLoading.macrosHistory = true;
      this.firestoreService.getUserMacrosHistory(this.currentUserId, this.limit, this.skip, this.macrosStartDate, this.macrosEndDate).subscribe((userMacros: any) => {
        this.userMacrosHistory = userMacros;
        this.isLoading.macrosHistory = false;
      });
    } catch (error) {
      this.isLoading.macrosHistory = false;
      // TODO Error
    }
  }

  getFormattedDate(date: Timestamp): any {
    if (date.seconds && date.nanoseconds)
      return moment(this.convertFirestoreTime(date)).format('Do MMMM YYYY');
  }

  convertFirestoreTime(date: any): any {
    if (date._seconds && date._nanoseconds)
      return moment(new Date(date._seconds * 1000 + date._nanoseconds / 1000000)).format('Do MMMM YYYY');
  }

  loadMore() {
    this.skip += this.limit;
    this.getUserWorkoutHistory();
  }

  loadMoreMacros() {
    this.getUserMacrosHistory();
  }

  // Helper methods to set date ranges for filtering
  setWorkoutDateRange(startDate: Date | null, endDate: Date | null): void {
    this.workoutStartDate = startDate;
    this.workoutEndDate = endDate;
    this.getUserWorkoutHistory();
  }

  setMacrosDateRange(startDate: Date | null, endDate: Date | null): void {
    this.macrosStartDate = startDate;
    this.macrosEndDate = endDate;
    this.getUserMacrosHistory();
  }

  clearWorkoutDateRange(): void {
    this.workoutStartDate = null;
    this.workoutEndDate = null;
    this.getUserWorkoutHistory();
  }

  clearMacrosDateRange(): void {
    this.macrosStartDate = null;
    this.macrosEndDate = null;
    this.getUserMacrosHistory();
  }

  onCalendarMonthChanged(event: { startDate: Date; endDate: Date }): void {
    // Set date ranges for both workout and macros
    this.workoutStartDate = event.startDate;
    this.workoutEndDate = event.endDate;
    this.macrosStartDate = event.startDate;
    this.macrosEndDate = event.endDate;

    this.getUserWorkoutHistory();
    this.getUserMacrosHistory();
  }
}
