import { inject, injectable } from "inversify";
import { PostgresRepository } from "../../repository/postgres.repository";
import TYPES from "../../config/types";
import * as admin from 'firebase-admin';
import { User } from "../models/User";
import { UserWorkout } from "../models/UserWorkout";
import { UserMacros } from "../models/UserMacros";
import { Exercise } from "../models/Exercise";

@injectable()
export class FirestoreToPostgresTransferWorker {
    
    private db: admin.firestore.Firestore;
    
    constructor(@inject(TYPES.PostgresRepository) private postgresRepository: PostgresRepository) {
        this.db = admin.firestore();
    }


    async transfer() {
        const data = await this.db.collection('workoutSummaries').get();
        data.forEach(doc => {
            const workoutData = doc.data();
            console.log(workoutData)
        })
        
    }

 
}