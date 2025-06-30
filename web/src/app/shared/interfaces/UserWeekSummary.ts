
import { Timestamp } from "@angular/fire/firestore";
import { MuscleGroupVolumes } from "./UserWorkout";

export interface UserWeekSummary {
    muscleGroupVolumes: MuscleGroupVolumes;
    userId: string;
    week: number;
    weekEnd: Timestamp;
    weekStart: Timestamp;
    year: number;
     macroAverages: {
         carbs_g: number;
    fats_g: number;
    kcal: number;
    protein_g: number;
     }
    muscleGroupSets: {
           chest: number;
        back: number;
        legs: number;
        shoulders: number;
        biceps: number;
        triceps: number;
        core: number;
        forearms: number;
    }
}