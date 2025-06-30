import { ExerciseEntry } from "./UserWorkout";

export interface UserExerciseSummary {
    exerciseName: string;
    history?: ExerciseEntry[];
    max1RMPR: number;
    max1RMPRDate: Date;
    maxVolumePR: number;
    maxVolumePRDate: Date;
    maxWeightPR: number;
    maxWeightPRDate: Date;
    userId: string
}