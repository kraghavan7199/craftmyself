import { UserWorkout } from "../models/UserWorkout";

export interface IWorkoutService {
    upsetWorkoutData(userWorkout: UserWorkout): Promise<void>;
}   