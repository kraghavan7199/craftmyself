import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FirestoreService } from "../../services/firestore.service";
import { ToastService } from "../../services/toast.service";
import { Exercise } from "../../shared/interfaces/Exercise";
import { selectUser } from "../../store/selectors";
import { ExerciseEntry, UserWorkout } from "../../shared/interfaces/UserWorkout";
import { Timestamp } from "@angular/fire/firestore";
import { debounceTime } from 'rxjs/operators';
import { PageWrapperComponent } from "../../shared/components/page-wrapper.component";

interface WorkoutDay {
  name: string;
  userId?: string;
  short: string;
  date: Date;
  exercises: PlannedExercise[];
  isToday: boolean;
}

interface PlannedExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
}

@Component({
    selector: 'app-workout-plan',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, PageWrapperComponent],
    templateUrl: './workout-plan.component.html'
})
export class WorkoutPlanComponent {
  weekDays: WorkoutDay[] = [
    { name: 'Monday', short: 'MON', date: new Date(), exercises: [], isToday: false },
    { name: 'Tuesday', short: 'TUE', date: new Date(), exercises: [], isToday: false },
    { name: 'Wednesday', short: 'WED', date: new Date(), exercises: [], isToday: false },
    { name: 'Thursday', short: 'THU', date: new Date(), exercises: [], isToday: false },
    { name: 'Friday', short: 'FRI', date: new Date(), exercises: [], isToday: false },
    { name: 'Saturday', short: 'SAT', date: new Date(), exercises: [], isToday: false },
    { name: 'Sunday', short: 'SUN', date: new Date(), exercises: [], isToday: false }
  ];

  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  selectedDay: WorkoutDay | null = null;
  showExerciseModal = false;
  showAutocomplete = false;
  currentUserId: string = '';
  currentWeekStart: Date = new Date();
  isSelectingExercise = false;
  isExerciseSelected = false;

  exerciseForm: FormGroup;
  currentWeekEnd = new Date();

  // Current day workout properties
  todaysWorkout = {} as UserWorkout;
  isLoading = { 
    exercises: false, 
    weeklyPlan: false, 
    currentDay: false 
  };

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService,
    private store: Store,
    private toast: ToastService
  ) {
    this.exerciseForm = this.fb.group({
      exercise: ['', Validators.required],
      exerciseId: ['']
    });
  }

  ngOnInit() {
    this.setUserId();
    this.setCurrentWeek();
    this.updateWeekDates();
    this.setTodayHighlight();
    this.exerciseForm.get('exercise')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(value => {
      // Don't filter if we just selected an exercise
        this.filterExercises(value);
      
    });
  }

  setUserId() {
    this.store.select(selectUser).subscribe(user => {
      this.currentUserId = user.uid;
      if (this.currentUserId) {
        this.loadExercises();
        this.getWeeklyPlan();
        this.getTodaysWorkout();
      }
    });
  }

  setCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() + mondayOffset);
  }

  updateWeekDates() {
    for (let i = 0; i < this.weekDays.length; i++) {
      const dayDate = new Date(this.currentWeekStart);
      dayDate.setDate(this.currentWeekStart.getDate() + i);
      this.weekDays[i].date = dayDate;
    }
  }

  setTodayHighlight() {
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const todayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

    // Reset all days
    this.weekDays.forEach(day => day.isToday = false);

    // Only highlight if current week
    if (this.isCurrentWeek()) {
      this.weekDays[todayIndex].isToday = true;
    }
  }

  isCurrentWeek(): boolean {
    const today = new Date();
    const todayWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    todayWeekStart.setDate(today.getDate() + mondayOffset);

    return this.currentWeekStart.getTime() === todayWeekStart.getTime();
  }

  previousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.updateWeekDates();
    this.getWeeklyPlan();
    this.setTodayHighlight();
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.updateWeekDates();
    this.getWeeklyPlan();
    this.setTodayHighlight();
  }

  getWeekDateRange(): string {
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(this.currentWeekStart.getDate() + 6);
    this.currentWeekEnd = weekEnd;

    const startMonth = this.currentWeekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const startDay = this.currentWeekStart.getDate();
    const endDay = weekEnd.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  }

  loadExercises() {
    try {
      this.isLoading.exercises = true;
      this.firestoreService.getExercises(0, 10).subscribe((response) => {
        if (response && response.data) {
          this.exercises = response.data;
        }
        this.isLoading.exercises = false;
      });
    } catch (err) {
      this.isLoading.exercises = false;
      this.toast.error('Error loading exercises');
    }
  }


  filterExercises(searchText: string): void {
    if (!searchText || searchText.trim() === '') {
      this.filteredExercises = [];
      this.showAutocomplete = false;
      return;
    }

    // Don't show autocomplete if an exercise is already selected
    if (this.isExerciseSelected) {
      this.showAutocomplete = false;
      return;
    }

    // Use server-side search instead of client-side filtering
    this.firestoreService.getExercises(0, 50, searchText).subscribe((response) => {
      if (response && response.data) {
        this.filteredExercises = response.data;
        this.showAutocomplete = this.filteredExercises.length > 0;
      }
    });
  }

  selectExercise(exercise: Exercise): void {
    this.isExerciseSelected = true;
    this.exerciseForm.get('exercise')?.setValue(exercise.name);
    this.exerciseForm.get('exerciseId')?.setValue(exercise.id);
    this.showAutocomplete = false;
    this.filteredExercises = [];
  }

  onFocusExerciseInput(): void {
    const currentValue = this.exerciseForm.get('exercise')?.value;
    if (currentValue && !this.isExerciseSelected) {
      this.filterExercises(currentValue);
    }
  }

  onInputChange(): void {
    // Reset the exercise selection flag when user types
    this.isExerciseSelected = false;
  }

  resetExerciseForm(): void {
    this.exerciseForm.reset();
    this.isExerciseSelected = false;
    this.showAutocomplete = false;
  }

  openExerciseModal(day: WorkoutDay) {
    if (this.isPastDay(day)) {
      this.toast.info('Cannot add exercises to past days');
      return;
    }

    this.selectedDay = day;
    this.showExerciseModal = true;
    this.resetExerciseForm();
  }

  closeExerciseModal() {
    this.showExerciseModal = false;
    this.selectedDay = null;
    this.exerciseForm.reset();
    this.showAutocomplete = false;
    this.isExerciseSelected = false;
  }

  addExercise() {
    if (!this.exerciseForm.valid || !this.selectedDay) {
      this.toast.info('Please fill all required fields');
      return;
    }

    // If it's today, add to current day workout
    if (this.selectedDay.isToday) {
      this.addExerciseToCurrentDay();
      return;
    }

    // Otherwise, add to planned exercises
    const newExercise: PlannedExercise = {
      id: Date.now().toString(),
      exerciseId: this.exerciseForm.get('exerciseId')?.value,
      exerciseName: this.exerciseForm.get('exercise')?.value
    };

    if (this.selectedDay.exercises.some(ex => ex.exerciseId === newExercise.exerciseId)) {
      this.toast.info('Exercise already added to this day');
      return;
    }

    this.selectedDay.exercises.push(newExercise);
    this.toast.success(`Added ${newExercise.exerciseName} to ${this.selectedDay.name}`);
    this.closeExerciseModal();
    this.saveWorkoutPlan();
  }

  removeExercise(day: WorkoutDay, exerciseId: string) {
    if (this.isPastDay(day)) {
      this.toast.info('Cannot remove exercises from past days');
      return;
    }

    day.exercises = day.exercises.filter(ex => ex.id !== exerciseId);
    this.toast.success('Exercise removed');

    this.saveWorkoutPlan();
  }

  saveWorkoutPlan() {
    // Convert weekDays to the format expected by the API
    const weekDaysData = this.weekDays
      .filter(day => day.exercises.length > 0) // Only include days with exercises
      .map(day => ({
        date: day.date,
        exercises: day.exercises.map(exercise => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName
        }))
      }));

    const workoutPlan = {
      userId: this.currentUserId,
      weekStart: this.currentWeekStart,
      weekEnd: this.currentWeekEnd,
      weekDays: weekDaysData
    };

    this.firestoreService.upsertWeeklyPlan(workoutPlan).subscribe(res => {
      this.getWeeklyPlan();
    })

  }

  preventInvalid(event: KeyboardEvent) {
    if (['-', 'e', '+'].includes(event.key)) {
      event.preventDefault();
    }
  }

  getTotalExercises(): number {
    return this.weekDays.reduce((total, day) => total + day.exercises.length, 0);
  }

  getActiveDays(): number {
    return this.weekDays.filter(day => day.exercises.length > 0).length;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isPastDay(day: WorkoutDay): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const inputDate = new Date(day.date);
    inputDate.setHours(0, 0, 0, 0);

    return inputDate < tomorrow;
  }

  getWeeklyPlan(): any {
    this.isLoading.weeklyPlan = true;
    return this.firestoreService.getWeeklyPlan(this.currentUserId, this.currentWeekStart).subscribe(planData => {
      // Reset all exercises first
      this.weekDays.forEach(day => day.exercises = []);
      
      if (planData && Array.isArray(planData)) {
        // Map the API response to our weekDays structure
        planData.forEach((dayPlan: any) => {
          const workoutDate = new Date(dayPlan.workoutDate);
          const dayOfWeek = workoutDate.getDay();
          const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
          
          if (dayIndex >= 0 && dayIndex < this.weekDays.length) {
            this.weekDays[dayIndex].exercises = dayPlan.exercises.map((exercise: any) => ({
              id: `${exercise.exerciseId}-${Date.now()}`,
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName
            }));
          }
        });
      }
      
      // Update isToday flags
      this.setTodayHighlight();
      this.isLoading.weeklyPlan = false;
    });
  }

  // Current day workout methods
  getTodaysWorkout() {
    try {
      this.isLoading.currentDay = true;
      this.firestoreService.getCurrentDayUserWorkout(this.currentUserId).subscribe((workout => {
        const data = workout;
        if (data) {
          this.todaysWorkout = data;
        } else {
          this.todaysWorkout = {} as UserWorkout;
        }
        this.isLoading.currentDay = false;
      }));
    } catch (err) {
      this.toast.error('Error Getting Today\'s Workout');
      this.isLoading.currentDay = false;
    }
  }

  addExerciseToCurrentDay() {
    if (!this.exerciseForm.valid) {
      this.toast.info('Enter Valid Values!');
      return;
    }

    const selectedExercise = this.exercises.find(ex => ex.id === this.exerciseForm.get('exerciseId')?.value);

    const newExercise: ExerciseEntry = {
      exerciseId: this.exerciseForm.get('exerciseId')?.value,
      exerciseName: this.exerciseForm.get('exercise')?.value,
      muscleGroupCode: selectedExercise?.muscleGroupCode || '',
      muscleGroupName: selectedExercise?.muscleGroupName || '',
      sets: []
    };

    if (this.todaysWorkout.exercises && this.todaysWorkout.exercises.some(exercise => exercise.exerciseId === newExercise.exerciseId)) {
      this.toast.info('Exercise Already In Workout!');
      return;
    }

    this.isLoading.currentDay = true;
    this.todaysWorkout.userId = this.currentUserId;

    if (!this.todaysWorkout.exercises) {
      this.todaysWorkout.date = new Date();
      this.todaysWorkout.exercises = [newExercise];
      this.firestoreService.addUserWorkout(this.todaysWorkout).subscribe(_ => {
        this.resetExerciseForm();
        this.getTodaysWorkout();
        this.closeExerciseModal();
      });
      return;
    }

    this.todaysWorkout.exercises.push(newExercise);
    this.firestoreService.updateWorkout(this.todaysWorkout.id, this.todaysWorkout).subscribe(_ => {
      this.resetExerciseForm();
      this.toast.success('Added Exercise To Workout');
      this.getTodaysWorkout();
      this.closeExerciseModal();
    });
  }

}