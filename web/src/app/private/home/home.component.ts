import { Component } from "@angular/core";
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

@Component({
    selector: 'app-home',
    imports: [FormsModule, ReactiveFormsModule, CommonModule, PageWrapperComponent],
    templateUrl: './home.component.html'
})
export class HomeComponent {
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
  showCongratsModal = false;
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
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.exerciseToDelete = null;
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
      this.isLoading.workoutLog = true;
      const newSet = { id: uuidv4(), reps: reps, weight: weight, timestamp: new Date() };
      exercise.sets.push(newSet)
      this.newSetReps[exercise.exerciseId] = null;
      this.newSetWeight[exercise.exerciseId] = null;
      this.todaysWorkout.userId = this.currentUserId;
      this.firestoreService.updateWorkout(this.todaysWorkout.id, this.todaysWorkout).subscribe(_ => {
        this.resetExerciseForm();
        this.checkForNewWeightPR(exercise.exerciseId, weight, exercise.exerciseName);
        this.getTodaysWorkout()
      })


    } catch (error) {
      this.toast.error('Error Adding Set');
    }

  }
  deleteSet(exercise: ExerciseEntry, setId: string) {
    try {
      exercise.sets = exercise.sets.filter(set => set.id !== setId)
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
  }

  // Check for new weight PR
  checkForNewWeightPR(exerciseId: string, newWeight: number, exerciseName: string) {
    this.firestoreService.getUserExerciseHistory(exerciseId, this.currentUserId).subscribe(history => {
      if (history && history.maxWeightPR && newWeight > history.maxWeightPR) {
        this.newPRWeight = newWeight;
        this.newPRExerciseName = exerciseName;
        this.hasWeightPR = true;
        this.showCongratsModal = true;
      }
    });
  }

  // Method to close congratulations modal
  closeCongratsModal() {
    this.showCongratsModal = false;
    this.newPRWeight = 0;
    this.newPRExerciseName = '';
    this.hasWeightPR = false;
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

}