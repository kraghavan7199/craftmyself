export interface UserWorkoutSummary {
    userId: string;
    workoutId: string;
    date: Date;
    muscleGroupVolumes: {
        chest: number;
        back: number;
        legs: number;
        shoulders: number;
        arms: number;
        core: number;
    };
    exercises: {
        exerciseId: string;
        name: string;
        sets: number;
        reps: number;
        weight: number;
    }[];
    muscleGroupSets: {
        chest: number;
        back: number;
        legs: number;
        shoulders: number;
        arms: number;
        core: number;
    };  
}