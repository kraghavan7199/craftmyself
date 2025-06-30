export interface Exercise { 
    id: string;
    name: string;
    muscleGroupCode : string;
    muscleGroupName : string;
    reps?: number;
    sets?: number;
    weight?: number;
}