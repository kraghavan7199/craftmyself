import { ExerciseEntry } from "./UserWorkout";

export interface UserExerciseSummary {
    exerciseName: string;
    history?: ExerciseEntry[];
    max1RMPR: number;
    maxVolumePR: number;
    maxWeightPR: number;
    userId: string
}