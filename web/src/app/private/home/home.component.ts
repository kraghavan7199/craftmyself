import { Component, OnDestroy, HostListener } from "@angular/core";
import { Store } from '@ngrx/store';
import { FirestoreService } from "../../services/firestore.service";
import { Exercise } from "../../shared/interfaces/Exercise";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from "@angular/common";
import { ExerciseEntry, UserWorkout } from "../../shared/interfaces/UserWorkout";
import { selectUser } from "../../store/selectors";
import { v4 as uuidv4 } from 'uuid';
import { ToastService } from "../../services/toast.service";
import { UserExerciseSummary } from "../../shared/interfaces/UserExerciseSummary";
import { debounceTime } from 'rxjs/operators';
import { PageWrapperComponent } from "../../shared/animations";
import { WeekLogComponent } from "../../shared/components/week-log.component";

@Component({
    selector: 'app-home',
    imports: [FormsModule, ReactiveFormsModule, CommonModule, PageWrapperComponent, WeekLogComponent],
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnDestroy {
  selectedExerciseHistory: UserExerciseSummary = {} as UserExerciseSummary;
  exercises: Exercise[] = [];
  exerciseForm: FormGroup;
  filteredExercises = [] as Exercise[];
  todaysWorkout = {} as UserWorkout;
  showAutocomplete = false;
  currentUserId: string = '';
  newSetWeight: { [key: string]: number | null } = {};
  newSetReps: { [key: string]: number | null } = {};
  todaysDate: Date = new Date();
  showPRModal = false;
  newPRWeight = 0;
  newPRExerciseName = '';
  hasWeightPR = false;
  isLoading = { workoutLog: false, exerciseForm: false }
  selectedExercise: any = null;
  accordionStates: boolean[] = [];
  showDeleteModal = false;
  exerciseToDelete: ExerciseEntry | null = null;
  autocompletePosition = { top: 0, left: 0, width: 0 };
  isExerciseSelected = false;
  exercisePRData: { [key: string]: number | null } = {};
  showWeekLogModal = false;
  showCongratsModal = false;
  congratsMessage = '';
  newPRDetails = { exerciseName: '', weight: 0, previousPR: 0 };
  constructor(private firestoreService: FirestoreService, private fb: FormBuilder, private store: Store, private toast: ToastService) {
    this.exerciseForm = this.fb.group({
      exercise: ['', Validators.required],
      exerciseId: [''],
    });
  }

  ngOnInit() {
    this.setUserId();

    this.isLoading.workoutLog = true;
    this.isLoading.exerciseForm = true;
    this.exerciseForm.get('exercise')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(value => {
      this.filterExercises(value);
    });
  }

  setUserId() {
    this.store.select(selectUser).subscribe(user => {
      this.currentUserId = user.uid;
      if (this.currentUserId)
        this.setExercises()
    })
  }


  setExercises() {
    try {
      this.firestoreService.getExercises(0, 1000).subscribe((response) => {
        if (response && response.data) {
          this.exercises = response.data;
          this.getTodaysWorkout();
          this.isLoading.exerciseForm = false;
        }
      });
    } catch (err) {
      this.toast.error('Error Getting Exercise');
    }
  }

  filterExercises(searchText: string): void {
    if (!searchText) {
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

  getTodaysWorkout() {
    try {
      this.isLoading.workoutLog = true;
      this.firestoreService.getCurrentDayUserWorkout(this.currentUserId).subscribe((workout => {

        const data = workout;
        if (data) {
          this.todaysWorkout = data;
          this.accordionStates = new Array(data.exercises?.length || 0).fill(true);
          
          // Load PR data for existing exercises
          if (data.exercises) {
            data.exercises.forEach(exercise => {
              this.getExercisePRForPlaceholder(exercise.exerciseId);
            });
          }
        } else {
          this.todaysWorkout = {} as UserWorkout;
          this.accordionStates = [];
        }

        this.isLoading.workoutLog = false;

      }))
    } catch (err) {
      this.toast.error('Error Getting Todays Workout');
    }

  }

  openDeleteModal(exercise: ExerciseEntry) {
    this.exerciseToDelete = exercise;
    this.showDeleteModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.exerciseToDelete = null;
    // Restore body scroll when modal is closed
    document.body.style.overflow = 'auto';
  }

  confirmDeleteExercise() {
    if (this.exerciseToDelete) {
      this.closeDeleteModal();
      this.deleteExercise(this.exerciseToDelete);
    }
  }

  deleteExercise(exercise: ExerciseEntry) {
    try {
      this.isLoading.workoutLog = true;
      this.todaysWorkout.exercises = this.todaysWorkout.exercises.filter((ex: any) => ex.exerciseId !== exercise.exerciseId);
      if (!this.todaysWorkout.exercises.length) {
        this.firestoreService.deleteUserWorkout(this.todaysWorkout.id).subscribe(_ => {
          this.todaysWorkout = {} as UserWorkout;
          this.isLoading.workoutLog = false;
        })
      }
      else {
        this.todaysWorkout.userId = this.currentUserId;
        this.firestoreService.updateWorkout(this.todaysWorkout.id, this.todaysWorkout).subscribe(_ => {
          this.getTodaysWorkout()
        });
      }
    } catch (error) {
      this.isLoading.workoutLog = false;
      console.log(error);
      this.toast.error('Error Deleting Exercise');
    }
  }
  addExercise() {
    if (!this.exerciseForm.valid) {
      this.toast.info('Enter Valid Values!')
      return;
    }

    const selectedExercise = this.exercises.find(ex => ex.id === this.exerciseForm.get('exerciseId')?.value);

    const newExercise: ExerciseEntry = {
      exerciseId: this.exerciseForm.get('exerciseId')?.value,
      exerciseName: this.exerciseForm.get('exercise')?.value,
      muscleGroupCode: selectedExercise?.muscleGroupCode || '',
      muscleGroupName: selectedExercise?.muscleGroupName || '',
      sets: []
    }

    if (this.todaysWorkout.exercises && this.todaysWorkout.exercises.some(exercise => exercise.exerciseId === newExercise.exerciseId)) {
      this.toast.info('Exercise Already In Workout!');
      return;
    }
    
    // Fetch PR data for the new exercise
    this.getExercisePRForPlaceholder(newExercise.exerciseId);
    
    this.isLoading.workoutLog = true;
    this.todaysWorkout.userId = this.currentUserId;
    if (!this.todaysWorkout.exercises) {
      this.todaysWorkout.date = new Date();
      this.todaysWorkout.exercises = [newExercise];
      this.firestoreService.addUserWorkout(this.todaysWorkout).subscribe(_ => {
        this.resetExerciseForm();
        this.getTodaysWorkout();
      })
      return;
    }
    this.todaysWorkout.exercises.push(newExercise);

    this.firestoreService.updateWorkout(this.todaysWorkout.id, this.todaysWorkout).subscribe(_ => {
      this.resetExerciseForm();
      this.toast.success('Added Exercise To Workout')
      this.getTodaysWorkout()
    })

  }

  addSet(exercise: ExerciseEntry) {
    try {

      const reps = this.newSetReps[exercise.exerciseId]
      const weight = this.newSetWeight[exercise.exerciseId]

      if (!reps) {
        this.toast.info('Enter Valid Reps');
        return;
      }

      if (!weight) {
        this.toast.info('Enter Valid Weight');
        return;
      }

      // Check if this is a new PR before adding the set
      this.checkForNewPR(exercise, weight);

      this.isLoading.workoutLog = true;
      const newSet = { id: uuidv4(), reps: reps, weight: weight, timestamp: new Date() };
      exercise.sets.push(newSet)
      this.newSetReps[exercise.exerciseId] = null;
      this.newSetWeight[exercise.exerciseId] = null;
      this.todaysWorkout.userId = this.currentUserId;
      this.firestoreService.updateWorkout(this.todaysWorkout.id, this.todaysWorkout).subscribe(_ => {
        this.resetExerciseForm();
        this.getTodaysWorkout()
      })


    } catch (error) {
      this.toast.error('Error Adding Set');
    }

  }
  deleteSet(exercise: ExerciseEntry, setId: string) {
    try {
      exercise.sets = exercise.sets.filter(set => set.id !== setId);
      
      // Always recalculate PR after deleting a set, whether sets remain or not
      this.recalculateExercisePR(exercise);
      
      this.todaysWorkout.userId = this.currentUserId;
      this.firestoreService.updateWorkout(this.todaysWorkout.id, this.todaysWorkout).subscribe(_ => {
        this.resetExerciseForm();
        this.getTodaysWorkout()
      })
    } catch (error) {
      this.toast.error('Error Deleting Set');
    }


  }

  preventInvalid(event: KeyboardEvent) {
    if (['-', 'e', '+'].includes(event.key)) {
      event.preventDefault();
    }
  }

  openPRModal(exercise: any) {
    this.selectedExercise = exercise;
    this.getUserExerciseHistory()
    this.showPRModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  getUserExerciseHistory() {
    try {
      if (this.selectedExercise)
        this.firestoreService.getUserExerciseHistory(this.selectedExercise?.exerciseId, this.currentUserId).subscribe(res => {
          this.selectedExerciseHistory = res
        });
    } catch (err) {
      // TODO ERROR Handling
    }
  }

  // Method to close PR modal
  closePRModal() {
    this.showPRModal = false;
    this.selectedExercise = null;
    // Restore body scroll when modal is closed
    document.body.style.overflow = 'auto';
  }

  // Check for new PR and show congratulations
  checkForNewPR(exercise: ExerciseEntry, newWeight: number) {
    const currentPR = this.exercisePRData[exercise.exerciseId];
    
    if (!currentPR || newWeight > currentPR) {
      // This is a new PR!
      this.newPRDetails = {
        exerciseName: exercise.exerciseName,
        weight: newWeight,
        previousPR: currentPR || 0
      };
      
      if (currentPR) {
        this.congratsMessage = `🎉 NEW PERSONAL RECORD! 🎉`;
      } else {
        this.congratsMessage = `🎉 FIRST PERSONAL RECORD! 🎉`;
      }
      
      // Update the PR data immediately
      this.exercisePRData[exercise.exerciseId] = newWeight;
      
      // Add celebration sound effect here if desired
      // this.playCelebrationSound();
      
      // Show congratulations modal with a slight delay for better UX
      setTimeout(() => {
        this.showCongratsModal = true;
        document.body.style.overflow = 'hidden';
        
        // Auto-close the modal after 5 seconds (optional)
        setTimeout(() => {
          if (this.showCongratsModal) {
            this.closeCongratsModal();
          }
        }, 5000);
      }, 500);
    }
  }

  // Method to close congratulations modal
  closeCongratsModal() {
    this.showCongratsModal = false;
    document.body.style.overflow = 'auto';
  }

  // Method to recalculate exercise PR after set deletion
  recalculateExercisePR(exercise: ExerciseEntry) {
    // Find the maximum weight from remaining sets in current workout
    const currentMaxWeight = exercise.sets.length > 0 
      ? Math.max(...exercise.sets.map(set => set.weight))
      : 0;
    
    // For the placeholder display, we need to compare current max with historical PR
    this.firestoreService.getUserExerciseHistory(exercise.exerciseId, this.currentUserId).subscribe(history => {
      const historicalPR = history?.maxWeightPR || 0;
      
      // If we have sets remaining, check if any of them is still a PR
      if (currentMaxWeight > 0) {
        // Keep the higher value between current session max and historical PR
        // This ensures we don't show a lower PR just because we deleted a set
        this.exercisePRData[exercise.exerciseId] = Math.max(currentMaxWeight, historicalPR);
      } else {
        // If no sets remain, fall back to historical PR
        this.exercisePRData[exercise.exerciseId] = historicalPR > 0 ? historicalPR : null;
      }
    });
  }

  // Add this method to fetch PR data for an exercise
  getExercisePRForPlaceholder(exerciseId: string) {
    if (!this.exercisePRData[exerciseId]) {
      this.firestoreService.getUserExerciseHistory(exerciseId, this.currentUserId).subscribe(history => {
        this.exercisePRData[exerciseId] = history?.maxWeightPR || null;
      });
    }
  }

  // Add a helper method to get the placeholder text
  getWeightPlaceholder(exerciseId: string): string {
    const pr = this.exercisePRData[exerciseId];
    if (pr) {
      return `Weight (PR: ${pr}${ pr > 1 ? 'kgs' : 'kg'})`;
    }
    return 'Weight';
  }

  formatSetTime(timestamp: Date): string {
    if (!timestamp) return '';
    const setTime = new Date(timestamp);
    return setTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  toggleAccordion(index: number): void {
    this.accordionStates[index] = !this.accordionStates[index];
  }

  expandAllAccordions(): void {
    this.accordionStates = this.accordionStates.map(() => true);
  }

  collapseAllAccordions(): void {
    this.accordionStates = this.accordionStates.map(() => false);
  }

  testToasts() {
    this.toast.success('Success: Exercise added successfully!');
    setTimeout(() => this.toast.info('Info: Remember to stay hydrated during your workout!'), 500);
    setTimeout(() => this.toast.error('Error: Failed to save workout data!'), 1000);
    setTimeout(() => this.toast.warning('Warning: This exercise may require a spotter!'), 1500);
  }

  openWeekLogModal(): void {
    this.showWeekLogModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeWeekLogModal(): void {
    this.showWeekLogModal = false;
    // Restore body scroll when modal is closed
    document.body.style.overflow = 'auto';
  }

  ngOnDestroy(): void {
    // Ensure body scroll is restored when component is destroyed
    document.body.style.overflow = 'auto';
  }

  // Helper method to check if any modal is currently open
  private isAnyModalOpen(): boolean {
    return this.showWeekLogModal || this.showPRModal || this.showDeleteModal ;
  }

  // Handle Escape key to close modals
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showWeekLogModal) {
      this.closeWeekLogModal();
    } else if (this.showPRModal) {
      this.closePRModal();
    } else if (this.showDeleteModal) {
      this.closeDeleteModal();
    }
  }

}