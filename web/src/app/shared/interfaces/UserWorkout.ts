import { Timestamp } from "@angular/fire/firestore";

export interface UserWorkout {
    id: string
    userId: string;
    date: Date
    exercises: ExerciseEntry[];
    muscleGroupVolumes?: MuscleGroupVolumes;
}

export interface ExerciseEntry {
    exerciseId: string;
    exerciseName: string;
    muscleGroupCode: string;
    muscleGroupName: string;
    sets: {id:string, reps: number, weight: number, timestamp: Date}[]
  }

  export interface MuscleGroupVolumes {
    back: number;
    biceps: number;
    chest: number;
    core: number;
    legs: number;
    shoulders: number;
    triceps: number;
    forearms: number;
  }