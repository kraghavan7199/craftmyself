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
import { ExercisePRsComponent } from "./components/exercise-prs.component";
import { ComprehensiveAnalyticsComponent } from "./components/comprehensive-analytics.component";
import { ComprehensiveAnalytics } from "../../shared/interfaces/ComprehensiveAnalytics";
import { PageWrapperComponent } from "../../shared/components/page-wrapper.component";

Chart.register(...registerables);
@Component({
  selector: 'app-analytics',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    AnalyticsHeaderComponent,
    WeeklyMuscleSetsComponent,
    ProgressiveOverloadComponent,
    WeeklyProgressChartComponent,
    ExercisePRsComponent,
    ComprehensiveAnalyticsComponent,
    PageWrapperComponent
  ],
  templateUrl: './analytics.component.html'
})
export class AnalyticsComponent {
  activeTab: string = 'weekly';
  currentUserId: any;
  showInsightsModal = false;
  weeklySummary = [] as UserWeekSummary[];
  showAutocomplete = false;
  exercisePRs: UserExerciseSummary[] = [];
  exercisePRsTotalCount: number = 0;
  exercisePRsCurrentPage: number = 1;
  exercisePRsLimit: number = 10;
  exercisePRsSearchQuery: string = '';
  isLoading = {
    weeklySummary: false,
    exercisePRs: false,
    comprehensiveAnalytics: false
  };
  comprehensiveAnalytics: ComprehensiveAnalytics | null = null;
  analyticsStartDate: Date | null = null;
  analyticsEndDate: Date | null = null;
  insights: any = null;
  dietInsights: any = null;
  isShowDietInsights = false;
  muscleGroups = [{ code: 'chest', name: 'Chest' }, { code: 'back', name: 'Back' }, { code: 'legs', name: 'Legs' },
  { code: 'shoulders', name: 'Shoulders' }, { code: 'biceps', name: 'Biceps' }, { code: 'triceps', name: 'Triceps' },
  { code: 'core', name: 'Core' }, { code: 'forearms', name: 'Forearms' }];

  macroAttribute = [{ code: 'kcal', name: 'Calories', unitLabel: 'Calories' },
  { code: 'protein_g', name: 'Proteins', unitLabel: 'Grams(g)' }, { code: 'fats_g', name: 'Fats', unitLabel: 'Grams(g)' },
  { code: 'carbs_g', name: 'Carbs', unitLabel: 'Grams(g)' }
  ];

  selectedMuscleGroup = this.muscleGroups[0];
  selectedMacroAttribute = this.macroAttribute[0];
  isCalSummary: any;
  progressiveOverloadStatus: { [key: string]: { status: string, change: number, percentage: number, propotionalChange: number } } = {};
  Math = Math;


  constructor(private store: Store, private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    this.setUserId()

  }

  setUserId() {
    this.store.select(selectUser).subscribe(user => {
      if (user && user.uid) {
        this.currentUserId = user.uid;
        this.getUserWeeklySummary();
        this.getUserExercisePRs();
        this.getComprehensiveAnalytics();
      }
    })
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

    const currentWeek = this.weeklySummary[this.weeklySummary.length - 1];
    const previousWeek = this.weeklySummary[this.weeklySummary.length - 2];

    this.progressiveOverloadStatus = {};

    this.muscleGroups.forEach(muscle => {
      const currentVolume = (currentWeek.muscleGroupVolumes as any)[muscle.code] || 0;
      const previousVolume = (previousWeek.muscleGroupVolumes as any)[muscle.code] || 0;

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


  getMuscleCodeValue(s: any, v: any) {
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

  onExercisePRsPageChanged(event: { page: number, limit: number, searchQuery: string }): void {
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

  getComprehensiveAnalytics(): void {
    try {
      if (!this.analyticsStartDate) {
        this.analyticsEndDate = new Date();
        this.analyticsStartDate = new Date(this.analyticsEndDate);
        this.analyticsStartDate.setDate(this.analyticsEndDate.getDate() - 30);
      }
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

  onAnalyticsDateRangeChanged(event: { startDate: Date, endDate: Date }): void {
    this.analyticsStartDate = event.startDate;
    this.analyticsEndDate = event.endDate;
    this.getComprehensiveAnalytics();
  }
}