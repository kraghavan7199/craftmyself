import { inject, injectable } from "inversify";
import { PostgresRepository } from "../../repository/postgres.repository";
import TYPES from "../../config/types";
import * as admin from 'firebase-admin';
import { User } from "../models/User";
import { UserWorkout } from "../models/UserWorkout";
import { UserMacros } from "../models/UserMacros";
import { Exercise } from "../models/Exercise";
import { IWorkoutService } from "../services/IWorkoutService";

@injectable()
export class FirestoreToPostgresTransferWorker {
    
    private db: admin.firestore.Firestore;
     private workoutService: IWorkoutService;
    
    constructor(@inject(TYPES.WorkoutService) workoutService: IWorkoutService) {
        this.db = admin.firestore();
        this.workoutService = workoutService;
    }


    async transfer() {
        const data = await this.db.collection('workoutSummaries').get();
        data.forEach(async doc => {
            const workoutData = doc.data();
            workoutData.date = this.convertSecondsAndNanosecondsToDate(workoutData.date._seconds, workoutData.date._nanoseconds)
            await this.workoutService.upsetWorkoutData(<UserWorkout>workoutData)
        })
        
    }

    convertSecondsAndNanosecondsToDate(seconds: number, nanoseconds:number) {
  // Convert seconds to milliseconds
  const secondsInMilliseconds = seconds * 1000;

  // Convert nanoseconds to milliseconds
  // 1 millisecond = 1,000,000 nanoseconds (10^6)
  const nanosecondsInMilliseconds = nanoseconds / 1000000;

  // Total milliseconds since the epoch
  const totalMilliseconds = secondsInMilliseconds + nanosecondsInMilliseconds;

  // Create a new Date object
  // The Date constructor can take milliseconds since the epoch as an argument
  const date = new Date(totalMilliseconds);

  return date;
}

 
}