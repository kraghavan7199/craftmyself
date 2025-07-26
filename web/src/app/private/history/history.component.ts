import { Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Store } from "@ngrx/store";
import { FirestoreService } from "../../services/firestore.service";
import { selectUser } from "../../store/selectors";
import moment from 'moment';
import { Timestamp } from "@angular/fire/firestore";
import { CommonModule } from "@angular/common";
import { PageWrapperComponent } from "../../shared/components/page-wrapper.component";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasWorkout: boolean;
  hasMacros: boolean;
  workoutData?: any;
  macrosData?: any;
}

@Component({
  selector: 'app-history',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
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

  // Calendar properties
  currentMonth = moment();
  calendarDays: CalendarDay[] = [];
  daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  showModal = false;
  selectedDate: Date | null = null;
  selectedDayData: any = null;
  moment = moment;

  setActiveHistoryTab(tab: string): void {
    this.activeHistoryTab = tab;
  }

  constructor(private store: Store, private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    this.setUserId();
    this.generateCalendar();
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
        this.generateCalendar();
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
        this.generateCalendar();
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

  // Calendar methods
  previousMonth() {
    this.currentMonth = this.currentMonth.clone().subtract(1, 'month');
    this.generateCalendar();
    this.emitMonthChange();
  }

  nextMonth() {
    this.currentMonth = this.currentMonth.clone().add(1, 'month');
    this.generateCalendar();
    this.emitMonthChange();
  }

  private emitMonthChange() {
    const startDate = this.currentMonth.clone().startOf('month').toDate();
    const endDate = this.currentMonth.clone().endOf('month').toDate();
    this.onCalendarMonthChanged({ startDate, endDate });
  }

  private generateCalendar() {
    const monthStart = this.currentMonth.clone().startOf('month');
    const monthEnd = this.currentMonth.clone().endOf('month');
    const calendarStart = monthStart.clone().startOf('week');
    const calendarEnd = monthEnd.clone().endOf('week');

    this.calendarDays = [];
    const current = calendarStart.clone();

    while (current.isSameOrBefore(calendarEnd)) {
      const dayData = this.getDayData(current.toDate());
      this.calendarDays.push({
        date: current.toDate(),
        isCurrentMonth: current.month() === this.currentMonth.month(),
        hasWorkout: dayData.hasWorkout,
        hasMacros: dayData.hasMacros,
        workoutData: dayData.workoutData,
        macrosData: dayData.macrosData
      });
      current.add(1, 'day');
    }
  }

  private getDayData(date: Date) {
    const dayStart = moment(date).startOf('day');
    const dayEnd = moment(date).endOf('day');

    const workoutData = this.userWorkoutHistory.find((workout: any) => {
      const workoutDate = this.getDateFromTimestamp(workout.date);
      return workoutDate && moment(workoutDate).isBetween(dayStart, dayEnd, null, '[]');
    });

    const macrosData = this.userMacrosHistory.find((macros: any) => {
      const macrosDate = this.getDateFromTimestamp(macros.date);
      return macrosDate && moment(macrosDate).isBetween(dayStart, dayEnd, null, '[]');
    });

    return {
      hasWorkout: !!workoutData,
      hasMacros: !!macrosData,
      workoutData,
      macrosData
    };
  }

  private getDateFromTimestamp(timestamp: any): Date | null {
    if (!timestamp) return null;
    
    if (timestamp._seconds && timestamp._nanoseconds) {
      return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
    }
    
    if (timestamp.seconds && timestamp.nanoseconds) {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    }
    
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
  }

  onDateClick(day: CalendarDay) {
    if (!day.isCurrentMonth) return;
    
    if ((this.activeHistoryTab === 'workout' && day.hasWorkout) || 
        (this.activeHistoryTab === 'macros' && day.hasMacros)) {
      this.selectedDate = day.date;
      this.selectedDayData = day;
      this.showModal = true;
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedDate = null;
    this.selectedDayData = null;
  }

  getDateCellClasses(day: CalendarDay): string {
    let classes = 'cursor-pointer rounded-lg transition-all duration-200 ';
    
    if (!day.isCurrentMonth) {
      classes += 'text-gray-600 ';
    } else {
      classes += 'hover:bg-gray-700 ';
      
      if (moment(day.date).isSame(moment(), 'day')) {
        classes += 'bg-primary-600 bg-opacity-20 border border-primary-500 ';
      }
      
      if ((this.activeHistoryTab === 'workout' && day.hasWorkout) || 
          (this.activeHistoryTab === 'macros' && day.hasMacros)) {
        classes += 'hover:bg-opacity-80 ';
      }
    }
    
    return classes;
  }

  getDateTextClasses(day: CalendarDay): string {
    let classes = 'font-medium ';
    
    if (!day.isCurrentMonth) {
      classes += 'text-gray-600 ';
    } else {
      classes += 'text-white ';
      
      if (moment(day.date).isSame(moment(), 'day')) {
        classes += 'text-primary-300 font-bold ';
      }
    }
    
    return classes;
  }

  trackByDate(index: number, day: CalendarDay): string {
    return day.date.toISOString();
  }
}
