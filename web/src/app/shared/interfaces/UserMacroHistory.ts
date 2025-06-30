
import { Timestamp } from "@angular/fire/firestore";
import { UserMacros } from "./UserMacros";

export interface UserMacroHistory {
    userMacros: UserMacros[];
    lastWorkoutTimestamp: Timestamp | null;
}