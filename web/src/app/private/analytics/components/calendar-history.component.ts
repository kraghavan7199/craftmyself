import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';
import moment from 'moment';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasWorkout: boolean;
  hasMacros: boolean;
  workoutData?: any;
  macrosData?: any;
}

@Component({
  selector: 'app-calendar-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-history.component.html'
})
export class CalendarHistoryComponent {
  @Input() activeHistoryTab: string = 'workout';
  @Input() userWorkoutHistory: any[] = [];
  @Input() userMacrosHistory: any[] = [];
  @Input() muscleGroups: any[] = [];
  @Input() isLoading: boolean = false;
  
  @Output() activeHistoryTabChange = new EventEmitter<string>();
  @Output() monthChanged = new EventEmitter<{ startDate: Date; endDate: Date }>();

  currentMonth = moment();
  calendarDays: CalendarDay[] = [];
  daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  showModal = false;
  selectedDate: Date | null = null;
  selectedDayData: any = null;
  moment = moment;

  ngOnInit() {
    this.generateCalendar();
    this.emitMonthChange();
  }

  ngOnChanges() {
    this.generateCalendar();
  }

  setActiveHistoryTab(tab: string) {
    this.activeHistoryTab = tab;
    this.activeHistoryTabChange.emit(tab);
  }

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
    this.monthChanged.emit({ startDate, endDate });
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

    const workoutData = this.userWorkoutHistory.find(workout => {
      const workoutDate = this.getDateFromTimestamp(workout.date);
      return workoutDate && moment(workoutDate).isBetween(dayStart, dayEnd, null, '[]');
    });

    const macrosData = this.userMacrosHistory.find(macros => {
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