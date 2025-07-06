import { Component, ElementRef, HostListener, ViewChild } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet } from "@angular/router";
import { Store } from "@ngrx/store";
import { FirestoreService } from "../../services/firestore.service";
import { selectUser } from "../../store/selectors";
import moment from 'moment';
import { QueryDocumentSnapshot, Timestamp } from "@angular/fire/firestore";
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CommonModule, Time } from "@angular/common";
import { UserWeekSummary } from "../../shared/interfaces/UserWeekSummary";
import { UserExerciseSummary } from "../../shared/interfaces/UserExerciseSummary";
import { AnalyticsHeaderComponent } from "./components/analytics-header.component";
import { WeeklyMuscleSetsComponent } from "./components/weekly-muscle-sets.component";
import { ProgressiveOverloadComponent } from "./components/progressive-overload.component";
import { WeeklyProgressChartComponent } from "./components/weekly-progress-chart.component";
import { MacrosWeeklyChartComponent } from "./components/macros-weekly-chart.component";
import { CombinedHistoryComponent } from "./components/combined-history.component";
import { CalendarHistoryComponent } from "./components/calendar-history.component";
import { ExercisePRsComponent } from "./components/exercise-prs.component";
import { ComprehensiveAnalyticsComponent } from "./components/comprehensive-analytics.component";
import { ComprehensiveAnalytics } from "../../shared/interfaces/ComprehensiveAnalytics";
import { PageWrapperComponent } from "../../shared/components/page-wrapper.component";

Chart.register(...registerables);
@Component({
    selector: 'app-analytics',
    imports: [
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    AnalyticsHeaderComponent,
    WeeklyMuscleSetsComponent,
    ProgressiveOverloadComponent,
    WeeklyProgressChartComponent,
    MacrosWeeklyChartComponent,
    CombinedHistoryComponent,
    CalendarHistoryComponent,
    ExercisePRsComponent,
    ComprehensiveAnalyticsComponent,
    PageWrapperComponent
],
    templateUrl: './analytics.component.html'
})
export class AnalyticsComponent {
  activeTab: string = 'weekly';
  activeHistoryTab: string = 'workout';
  currentUserId: any;
  showInsightsModal = false;
  userWorkoutHistory = [] as any;
  userMacrosHistory = [] as any;
  weeklySummary = [] as UserWeekSummary[];
  showAutocomplete = false;
  exercisePRs: UserExerciseSummary[] = [];
  exercisePRsTotalCount: number = 0;
  exercisePRsCurrentPage: number = 1;
  exercisePRsLimit: number = 10;
  exercisePRsSearchQuery: string = '';
  isLoading = { 
    workoutHistory: false, 
    macrosHistory: false, 
    weeklySummary: false, 
    exercisePRs: false,
    comprehensiveAnalytics: false
  };
  comprehensiveAnalytics: ComprehensiveAnalytics | null = null;
  analyticsStartDate: Date | null = null;
  analyticsEndDate: Date | null = null;
  limit = 31;
  skip = 0;
  workoutStartDate: Date | null = null;
  workoutEndDate: Date | null = null;
  macrosStartDate: Date | null = null;
  macrosEndDate: Date | null = null;
  insights: any = null;
  dietInsights: any = null;
  isShowDietInsights = false;
  muscleGroups = [{ code: 'chest', name: 'Chest' }, { code: 'back', name: 'Back' }, { code: 'legs', name: 'Legs' },
  { code: 'shoulders', name: 'Shoulders' }, { code: 'biceps', name: 'Biceps' }, { code: 'triceps', name: 'Triceps' },
  { code: 'core', name: 'Core' }, {code: 'forearms', name: 'Forearms'}];

  macroAttribute = [ {code: 'kcal', name: 'Calories', unitLabel: 'Calories'}, 
    {code: 'protein_g', name: 'Proteins', unitLabel: 'Grams(g)'}, {code: 'fats_g', name: 'Fats', unitLabel: 'Grams(g)' },
    {code: 'carbs_g', name: 'Carbs', unitLabel: 'Grams(g)'}
  ];
  
  selectedMuscleGroup = this.muscleGroups[0];
  selectedMacroAttribute = this.macroAttribute[0];
isCalSummary: any;
  progressiveOverloadStatus: { [key: string]: { status: string, change: number, percentage: number, propotionalChange: number } } = {};
  Math = Math;

  setActiveHistoryTab(tab: string): void {
    this.activeHistoryTab = tab;
  }


  constructor(private store: Store, private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    this.setUserId()

  }

  setUserId() {
    this.store.select(selectUser).subscribe(user => {
      if (user && user.uid) {
        this.currentUserId = user.uid;
        this.initializeCalendarView();
        this.getUserWeeklySummary();
        this.getUserExercisePRs();
        this.getComprehensiveAnalytics();
      }

    })
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
      })
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
      })
    } catch (error) {
      this.isLoading.macrosHistory = false;
      // TODO Error
    }
  }

  getUserWeeklySummary() {
    try {
      this.isLoading.weeklySummary = true;
      this.firestoreService.getUserWeeklySummary(this.currentUserId).subscribe(userWeeklySummary => {
        this.weeklySummary = userWeeklySummary;
        this.calculateProgressiveOverload();
        this.isLoading.weeklySummary = false;
      })
    } catch (err) {
      this.isLoading.weeklySummary = false;
      // TODO Error Handling
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

  calculateProgressiveOverload(): void {
    if (this.weeklySummary.length < 2) {
      this.progressiveOverloadStatus = {};
      return;
    }

    const currentWeek = this.weeklySummary[this.weeklySummary.length -1];
    const previousWeek = this.weeklySummary[this.weeklySummary.length - 2];

    this.progressiveOverloadStatus = {};

    this.muscleGroups.forEach(muscle => {
      const currentVolume = (currentWeek.muscleGroupVolumes as any)[muscle.code] || 0;
      const previousVolume =(previousWeek.muscleGroupVolumes as any)[muscle.code] || 0;

      if (previousVolume === 0) {
        this.progressiveOverloadStatus[muscle.code] = {
          status: currentVolume > 0 ? 'new' : 'none',
          change: currentVolume,
          percentage: 0,
          propotionalChange: 0
        };
      } else {
        const change = currentVolume - previousVolume;
        const percentage = Math.round((change / previousVolume) * 100);
        const propotionalChange = Math.round((currentVolume / previousVolume) * 100);
        
        let status = 'maintained';
        if (change > 0) {
          status = 'increased';
        } else if (change < 0) {
          status = 'decreased';
        }

        this.progressiveOverloadStatus[muscle.code] = {
          status,
          change,
          percentage,
          propotionalChange
        };
      }
    });
  }

  getProgressiveOverloadForMuscle(muscleCode: string): any {

    return this.progressiveOverloadStatus[muscleCode] || { status: 'none', change: 0, percentage: 0 };
  }

  getCurrentWeekProgressiveOverload(): { overallStatus: string, improvedCount: number, totalCount: number } {
    const muscleGroupsWithData = this.muscleGroups.filter(muscle => {
      const status = this.getProgressiveOverloadForMuscle(muscle.code);
      return status.status !== 'none';
    });

    const improvedMuscles = muscleGroupsWithData.filter(muscle => {
      const status = this.getProgressiveOverloadForMuscle(muscle.code);
      return status.status === 'increased' || status.status === 'new';
    });

    const improvedCount = improvedMuscles.length;
    const totalCount = muscleGroupsWithData.length;

    let overallStatus = 'no-data';
    if (totalCount > 0) {
      const improvedPercentage = (improvedCount / totalCount) * 100;
      if (improvedPercentage >= 70) {
        overallStatus = 'excellent';
      } else if (improvedPercentage >= 50) {
        overallStatus = 'good';
      } else if (improvedPercentage >= 30) {
        overallStatus = 'moderate';
      } else {
        overallStatus = 'needs-improvement';
      }
    }

    return { overallStatus, improvedCount, totalCount };
  }


  loadMore() {
    this.skip += this.limit;
    this.getUserWorkoutHistory();
  }

  loadMoreMacros() {
    this.getUserMacrosHistory();
  }

  getMuscleCodeValue(s: any, v: any ) {
    return (s.muscleGroupVolumes as any)[(v as any)] || 0;
  }


  trackByCode(index: number, muscle: any): any {
    return muscle.code;
  }

  getCurrentWeekMuscleGroupSets(muscleCode: string): number {
    if (this.weeklySummary.length === 0) return 0;
    const currentWeek = this.weeklySummary[this.weeklySummary.length - 1];
    return (currentWeek.muscleGroupSets as any)[muscleCode] || 0;
  }

  getUserExercisePRs(): void {
    try {
      this.isLoading.exercisePRs = true;
      const skip = (this.exercisePRsCurrentPage - 1) * this.exercisePRsLimit;
      this.firestoreService.getUserExercisePRs(this.currentUserId, skip, this.exercisePRsLimit, this.exercisePRsSearchQuery).subscribe((response: any) => {
        this.exercisePRs = response.data || [];
        this.exercisePRsTotalCount = response.total || 0;
        this.isLoading.exercisePRs = false;
      });
    } catch (err) {
      this.isLoading.exercisePRs = false;
      // TODO Error Handling
    }
  }

  onExercisePRsPageChanged(event: {page: number, limit: number, searchQuery: string}): void {
    this.exercisePRsCurrentPage = event.page;
    this.exercisePRsLimit = event.limit;
    this.exercisePRsSearchQuery = event.searchQuery;
    this.getUserExercisePRs();
  }

  onExercisePRsSearchChanged(searchQuery: string): void {
    this.exercisePRsSearchQuery = searchQuery;
    this.exercisePRsCurrentPage = 1;
    this.getUserExercisePRs();
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

  getComprehensiveAnalytics(): void {
    try {
      this.isLoading.comprehensiveAnalytics = true;
      this.firestoreService.getComprehensiveAnalytics(
        this.currentUserId, 
        this.analyticsStartDate, 
        this.analyticsEndDate
      ).subscribe((analytics: ComprehensiveAnalytics) => {
        this.comprehensiveAnalytics = analytics;
        this.isLoading.comprehensiveAnalytics = false;
      });
    } catch (error) {
      this.isLoading.comprehensiveAnalytics = false;
      console.error('Error fetching comprehensive analytics:', error);
    }
  }

  setAnalyticsDateRange(startDate: Date | null, endDate: Date | null): void {
    this.analyticsStartDate = startDate;
    this.analyticsEndDate = endDate;
    this.getComprehensiveAnalytics();
  }

  clearAnalyticsDateRange(): void {
    this.analyticsStartDate = null;
    this.analyticsEndDate = null;
    this.getComprehensiveAnalytics();
  }

  onAnalyticsDateRangeChanged(event: {startDate: Date, endDate: Date}): void {
    this.analyticsStartDate = event.startDate;
    this.analyticsEndDate = event.endDate;
    this.getComprehensiveAnalytics();
  }
}