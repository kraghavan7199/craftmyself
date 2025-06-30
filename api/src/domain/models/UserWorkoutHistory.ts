import {  Timestamp } from "firebase-admin/firestore";
import { UserWorkout } from "./UserWorkout";

export interface UserWorkoutHistory {
    userWorkouts: UserWorkout[],
    lastWorkoutTimestamp: Timestamp | null;
}