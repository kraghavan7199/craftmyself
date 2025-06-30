import {  Timestamp } from "@angular/fire/firestore";
import { UserWorkout } from "./UserWorkout";

export interface UserWorkoutHistory {
    userWorkouts: UserWorkout[],
    lastWorkoutTimestamp: Timestamp | null
}