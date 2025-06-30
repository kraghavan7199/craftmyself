
import { MuscleGroupVolumes } from "./UserWorkout";

export interface UserWeekSummary {
    muscleGroupVolumes: MuscleGroupVolumes;
    userId: string;
    week: number;
    weekEnd: Date;
    weekStart: Date;
    year: number;
    muscleGroupSets: {
        chest: number;
        back: number;
        legs: number;
        shoulders: number;
        biceps: number;
        triceps: number;
        core: number;
    };
}