import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../services/firestore.service';
import { UserWorkout } from '../interfaces/UserWorkout';

@Component({
  selector: 'app-week-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="week-log-container">
      @if (isLoading) {
        <div class="flex items-center justify-center p-8">
          <div class="relative w-12 h-12">
            <div class="absolute top-0 left-0 w-full h-full border-4 border-muted opacity-20 rounded-full"></div>
            <div class="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          </div>
          <p class="ml-4 text-primary font-medium">Loading week log...</p>
        </div>
      } @else if (weekWorkouts.length === 0) {
        <div class="text-center p-8">
          <div class="text-muted-foreground mb-2">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8h.01M7 21h10"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-foreground mb-2">No Workouts This Week</h3>
          <p class="text-muted-foreground">You haven't logged any workouts for this week yet.</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (workout of weekWorkouts; track workout.id) {
            <div class="border border-border rounded-lg bg-card p-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold text-foreground">
                  {{ getWorkoutDate(workout.date) }}
                </h3>
                <div class="text-sm text-muted-foreground">
                  {{ workout.exercises.length || 0 }} exercises
                </div>
              </div>
              
              @if (workout.exercises && workout.exercises.length > 0) {
                <div class="space-y-3">
                  @for (exercise of workout.exercises; track exercise.exerciseId) {
                    <div class="bg-muted/30 rounded-lg p-3">
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-foreground">{{ exercise.exerciseName }}</h4>
                        <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {{ exercise.muscleGroupName }}
                        </span>
                      </div>
                      
                      @if (exercise.sets && exercise.sets.length > 0) {
                        <div class="space-y-1">
                          <div class="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground mb-1">
                            <span>Set</span>
                            <span>Weight</span>
                            <span>Reps</span>
                          </div>
                          @for (set of exercise.sets; track set.id; let i = $index) {
                            <div class="grid grid-cols-3 gap-2 text-sm">
                              <span class="text-foreground">{{ i + 1 }}</span>
                              <span class="text-foreground font-medium">{{ set.weight }}kg</span>
                              <span class="text-foreground">{{ set.reps }}</span>
                            </div>
                          }
                        </div>
                        
                        <!-- Summary stats -->
                        <div class="mt-2 pt-2 border-t border-border/50">
                          <div class="flex justify-between text-xs text-muted-foreground">
                            <span>Total Sets: {{ exercise.sets.length }}</span>
                            <span>Max Weight: {{ getMaxWeight(exercise.sets) }}kg</span>
                            <span>Total Reps: {{ getTotalReps(exercise.sets) }}</span>
                          </div>
                        </div>
                      } @else {
                        <p class="text-sm text-muted-foreground">No sets recorded</p>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
          
          <!-- Week Summary -->
          <div class="border border-border rounded-lg bg-card p-4 mt-4">
            <h3 class="text-lg font-semibold text-foreground mb-3">Week Summary</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">{{ getTotalWorkouts() }}</div>
                <div class="text-muted-foreground">Workouts</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">{{ getTotalExercises() }}</div>
                <div class="text-muted-foreground">Exercises</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">{{ getTotalSets() }}</div>
                <div class="text-muted-foreground">Total Sets</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">{{ getTotalVolume() }}</div>
                <div class="text-muted-foreground">Volume (kg)</div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .week-log-container {
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .week-log-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .week-log-container::-webkit-scrollbar-track {
      background: hsl(var(--muted));
    }
    
    .week-log-container::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground));
      border-radius: 3px;
    }
    
    .week-log-container::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--foreground));
    }
  `]
})
export class WeekLogComponent implements OnInit, OnChanges {
  @Input() userId!: string;
  @Input() weekStartDate?: Date;
  
  weekWorkouts: UserWorkout[] = [];
  isLoading = false;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    if (this.userId) {
      this.loadCurrentWeekWorkouts();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] || changes['weekStartDate']) {
      if (this.userId) {
        this.loadCurrentWeekWorkouts();
      }
    }
  }

  private loadCurrentWeekWorkouts() {
    this.isLoading = true;
    
    // Calculate current week start and end dates
    const now = this.weekStartDate || new Date();
    const startOfWeek = this.getStartOfWeek(now);
    const endOfWeek = this.getEndOfWeek(startOfWeek);

    this.firestoreService.getUserWorkoutHistory(
      this.userId, 
      50, // limit - enough to cover a week
      0,  // skip
      startOfWeek, 
      endOfWeek
    ).subscribe({
      next: (history) => {
        this.weekWorkouts = history.userWorkouts || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading week workouts:', error);
        this.weekWorkouts = [];
        this.isLoading = false;
      }
    });
  }

  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Start from Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getEndOfWeek(startDate: Date): Date {
    const end = new Date(startDate);
    end.setDate(startDate.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  getWorkoutDate(date: any): string {
    let workoutDate: Date;
    
    if (date && typeof date === 'object' && (date._seconds || date.seconds)) {
      // Firestore Timestamp
      const seconds = date._seconds || date.seconds;
      const nanoseconds = date._nanoseconds || date.nanoseconds || 0;
      workoutDate = new Date(seconds * 1000 + nanoseconds / 1000000);
    } else {
      workoutDate = new Date(date);
    }
    
    return workoutDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }

  getMaxWeight(sets: any[]): number {
    if (!sets || sets.length === 0) return 0;
    return Math.max(...sets.map(set => set.weight || 0));
  }

  getTotalReps(sets: any[]): number {
    if (!sets || sets.length === 0) return 0;
    return sets.reduce((total, set) => total + (set.reps || 0), 0);
  }

  getTotalWorkouts(): number {
    return this.weekWorkouts.length;
  }

  getTotalExercises(): number {
    return this.weekWorkouts.reduce((total, workout) => 
      total + (workout.exercises?.length || 0), 0);
  }

  getTotalSets(): number {
    return this.weekWorkouts.reduce((total, workout) => 
      total + (workout.exercises?.reduce((exerciseTotal, exercise) => 
        exerciseTotal + (exercise.sets?.length || 0), 0) || 0), 0);
  }

  getTotalVolume(): number {
    return this.weekWorkouts.reduce((total, workout) => 
      total + (workout.exercises?.reduce((exerciseTotal, exercise) => 
        exerciseTotal + (exercise.sets?.reduce((setTotal, set) => 
          setTotal + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0) || 0), 0);
  }
}
