import { Timestamp } from "firebase-admin/firestore";
import { UserMacros } from "./UserMacros";

export interface UserMacroHistory {
    userMacros: UserMacros[];
    lastWorkoutTimestamp: Timestamp | null;
}