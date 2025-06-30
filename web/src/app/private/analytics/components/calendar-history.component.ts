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
  template: `
    <section class="bg-gray-800 bg-opacity-50 rounded-xl p-6 shadow-lg">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-indigo-400">History Calendar</h2>
            <p class="text-gray-400 text-sm">Track your daily progress</p>
          </div>
        </div>
        
        <!-- Toggle Buttons -->
        <div class="flex bg-gray-700 rounded-lg p-1 space-x-1">
          <button (click)="setActiveHistoryTab('workout')"
                  [class]="'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ' + 
                          (activeHistoryTab === 'workout' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600')">
            Workouts
          </button>
          <button (click)="setActiveHistoryTab('macros')"
                  [class]="'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ' + 
                          (activeHistoryTab === 'macros' ? 'bg-green-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600')">
            Macros
          </button>
        </div>
      </div>

      <!-- Month Navigation -->
      <div class="flex items-center justify-between mb-6">
        <button (click)="previousMonth()" 
                class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 class="text-lg font-semibold text-white">
          {{ currentMonth.format('MMMM YYYY') }}
        </h3>
        
        <button (click)="nextMonth()" 
                class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="bg-gray-900 bg-opacity-50 rounded-xl p-4">
        <!-- Days of week header -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div *ngFor="let day of daysOfWeek" class="text-center text-gray-400 text-sm font-medium py-2">
            {{ day }}
          </div>
        </div>
        
        <!-- Calendar days -->
        <div class="grid grid-cols-7 gap-1">
          <div *ngFor="let day of calendarDays; trackBy: trackByDate" 
               [class]="getDateCellClasses(day)"
               (click)="onDateClick(day)">
            <div class="relative w-full h-12 flex items-center justify-center">
              <span [class]="getDateTextClasses(day)">
                {{ day.date.getDate() }}
              </span>
              
              <!-- Indicators -->
              <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                <div *ngIf="day.hasWorkout && (activeHistoryTab === 'workout' || activeHistoryTab === 'both')" 
                     class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div *ngIf="day.hasMacros && (activeHistoryTab === 'macros' || activeHistoryTab === 'both')" 
                     class="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-8">
        <div class="relative w-16 h-16">
          <div class="absolute top-0 left-0 w-full h-full border-4 border-primary-200 opacity-20 rounded-full"></div>
          <div class="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
        </div>
        <p class="mt-4 text-primary-400 font-medium">Loading calendar data...</p>
      </div>
    </section>

    <!-- Modal for day details -->
    <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="closeModal()">
      <div class="bg-gray-800 rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-y-auto m-4 w-full" (click)="$event.stopPropagation()">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-white">
            {{ selectedDate ? moment(selectedDate).format('MMMM DD, YYYY') : '' }}
          </h3>
          <button (click)="closeModal()" class="text-gray-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Modal content based on active tab -->
        <div *ngIf="selectedDayData">
          <!-- Workout Details -->
          <div *ngIf="activeHistoryTab === 'workout' && selectedDayData.workoutData" class="space-y-6">
            <div class="bg-gray-700 bg-opacity-50 rounded-xl p-6">
              <h4 class="text-blue-300 text-lg font-semibold mb-4">Workout Details</h4>
              
              <!-- Muscle Group Volumes -->
              <div class="mb-6">
                <h5 class="text-blue-300 text-sm font-semibold mb-3">Muscle Group Volumes</h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div *ngFor="let group of muscleGroups" class="bg-gray-600 bg-opacity-60 p-3 rounded-lg">
                    <span class="text-gray-300 text-xs block">{{ group.name }}:</span>
                    <span class="text-white font-bold">{{ selectedDayData.workoutData?.muscleGroupVolumes?.[group.code] || 0 }} kg</span>
                  </div>
                </div>
              </div>
              
              <!-- Exercises -->
              <div *ngIf="selectedDayData.workoutData.exercises?.length">
                <h5 class="text-blue-300 text-sm font-semibold mb-3">Exercises</h5>
                <div class="bg-gray-900 bg-opacity-70 rounded-xl overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead>
                        <tr class="bg-gray-800 border-b border-gray-600">
                          <th class="text-left px-4 py-3 text-blue-300 font-semibold text-sm">Exercise</th>
                          <th class="text-center px-4 py-3 text-blue-300 font-semibold text-sm">Sets</th>
                          <th class="text-center px-4 py-3 text-blue-300 font-semibold text-sm">Reps</th>
                          <th class="text-center px-4 py-3 text-blue-300 font-semibold text-sm">Weight (kg)</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-700">
                        <tr *ngFor="let exercise of selectedDayData.workoutData.exercises" class="hover:bg-gray-800 hover:bg-opacity-50">
                          <td class="px-4 py-4">
                            <div class="text-white font-medium">{{ exercise.exerciseName }}</div>
                          </td>
                          <td class="px-4 py-4 text-center">
                            <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-600 bg-opacity-20 text-blue-300 rounded-full text-sm font-bold">
                              {{ exercise.sets.length }}
                            </span>
                          </td>
                          <td class="px-4 py-4 text-center">
                            <div class="flex flex-wrap justify-center gap-1">
                              <span *ngFor="let set of exercise.sets" class="inline-flex items-center px-2 py-1 bg-green-600 bg-opacity-20 text-green-300 rounded-md text-xs font-medium">
                                {{ set.reps }}
                              </span>
                            </div>
                          </td>
                          <td class="px-4 py-4 text-center">
                            <div class="flex flex-wrap justify-center gap-1">
                              <span *ngFor="let set of exercise.sets" class="inline-flex items-center px-2 py-1 bg-purple-600 bg-opacity-20 text-purple-300 rounded-md text-xs font-medium">
                                {{ set.weight }}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Macros Details -->
          <div *ngIf="activeHistoryTab === 'macros' && selectedDayData.macrosData" class="space-y-6">
            <div class="bg-gray-700 bg-opacity-50 rounded-xl p-6">
              <h4 class="text-green-300 text-lg font-semibold mb-4">Nutrition Details</h4>
              
              <!-- Daily Totals -->
              <div class="mb-6">
                <h5 class="text-green-300 text-sm font-semibold mb-3">Daily Totals</h5>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div class="bg-gray-600 bg-opacity-60 p-3 rounded-lg text-center">
                    <div class="text-xs text-gray-300 mb-1">Calories</div>
                    <div class="text-lg font-bold text-white">{{ selectedDayData.macrosData?.totals?.kcal | number:'1.0-0' }}</div>
                  </div>
                  <div class="bg-gray-600 bg-opacity-60 p-3 rounded-lg text-center">
                    <div class="text-xs text-gray-300 mb-1">Protein</div>
                    <div class="text-lg font-bold text-white">{{ selectedDayData.macrosData?.totals?.protein_g | number:'1.0-1' }}g</div>
                  </div>
                  <div class="bg-gray-600 bg-opacity-60 p-3 rounded-lg text-center">
                    <div class="text-xs text-gray-300 mb-1">Carbs</div>
                    <div class="text-lg font-bold text-white">{{ selectedDayData.macrosData?.totals?.carbs_g | number:'1.0-1' }}g</div>
                  </div>
                  <div class="bg-gray-600 bg-opacity-60 p-3 rounded-lg text-center">
                    <div class="text-xs text-gray-300 mb-1">Fats</div>
                    <div class="text-lg font-bold text-white">{{ selectedDayData.macrosData?.totals?.fats_g | number:'1.0-1' }}g</div>
                  </div>
                </div>
              </div>
              
              <!-- Food Items -->
              <div *ngIf="selectedDayData.macrosData.macros?.length">
                <h5 class="text-green-300 text-sm font-semibold mb-3">Food Items</h5>
                <div class="bg-gray-900 bg-opacity-60 rounded-lg overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-gray-800 bg-opacity-80">
                          <th class="text-left p-3 text-gray-300 font-semibold">Food Item</th>
                          <th class="text-center p-3 text-gray-300 font-semibold">Qty</th>
                          <th class="text-center p-3 text-gray-300 font-semibold">Cal</th>
                          <th class="text-center p-3 text-gray-300 font-semibold">P</th>
                          <th class="text-center p-3 text-gray-300 font-semibold">C</th>
                          <th class="text-center p-3 text-gray-300 font-semibold">F</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let foodItem of selectedDayData.macrosData.macros" class="border-t border-gray-700">
                          <td class="p-3 text-white">{{ foodItem.food_item }}</td>
                          <td class="p-3 text-center text-white font-semibold">{{ foodItem.quantity }}</td>
                          <td class="p-3 text-center text-white font-semibold">{{ foodItem.kcal }}</td>
                          <td class="p-3 text-center text-white font-semibold">{{ foodItem.protein_g }}</td>
                          <td class="p-3 text-center text-white font-semibold">{{ foodItem.carbs_g }}</td>
                          <td class="p-3 text-center text-white font-semibold">{{ foodItem.fats_g }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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