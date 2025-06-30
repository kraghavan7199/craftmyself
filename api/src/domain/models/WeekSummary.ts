import { Timestamp } from 'firebase-admin/firestore';
import { MuscleGroupSets, MuscleGroupVolumes } from './UserWorkout';
import { MacroAttributes } from './UserMacros';

export interface WeekSummary {
    userId: string;
    year: number;
    week: number;
    weekStart: Timestamp;
    weekEnd: Timestamp;
    muscleGroupVolumes?: MuscleGroupVolumes;
    macroAverages?: MacroAttributes;
    muscleGroupSets?: MuscleGroupSets;
}