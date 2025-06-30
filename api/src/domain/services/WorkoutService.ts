import { inject, injectable } from "inversify";
import { ExerciseEntry, MuscleGroupSets, MuscleGroupVolumes, UserWorkout } from "../models/UserWorkout";
// import { Timestamp } from 'firebase-admin/firestore';
// import * as logger from "firebase-functions/logger";
// import { FirestoreRepository } from "../../repository/firestore.repository";
import { PostgresRepository } from "../../repository/postgres.repository";
import TYPES from "../../config/types";
import { WeekSummary } from "../models/WeekSummary";
import { IWorkoutService } from "./IWorkoutService";
import { v4 as uuidv4 } from 'uuid';



@injectable()
export class WorkoutService implements IWorkoutService {
    postgresRepo!: PostgresRepository;
    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.postgresRepo = postgresRepo;
    }

    async upsetWorkoutData(userWorkout: UserWorkout) {

        const updateUserWorkout = this.prepareUserWorkoutData(userWorkout);
        await this.postgresRepo.upsertUserWorkoutData(updateUserWorkout)
    }


   private prepareUserWorkoutData(userWorkout: UserWorkout) {
        const muscleGroupVolumes = { chest: 0, back: 0, legs: 0, shoulders: 0, biceps: 0, triceps: 0, core: 0, forearms: 0 } as any;
        const muscleGroupSets = { chest: 0, back: 0, legs: 0, shoulders: 0, biceps: 0, triceps: 0, core: 0, forearms: 0 } as any;
        userWorkout.exercises.forEach((workoutExercise: ExerciseEntry) => {
            const muscleType = workoutExercise.muscleGroupCode;
            const volume = workoutExercise.sets.reduce((sum: number, { reps, weight }: { reps: number; weight: number }) => sum + reps * weight, 0);
            if (muscleType) {
                muscleGroupVolumes[muscleType] = (muscleGroupVolumes[muscleType] || 0) + volume;
                muscleGroupSets[muscleType] = (muscleGroupSets[muscleType] || 0) + workoutExercise.sets.length;
            }
        })

        userWorkout.muscleGroupVolumes = muscleGroupVolumes;
        userWorkout.muscleGroupSets = muscleGroupSets;
        userWorkout.id = userWorkout.id || uuidv4(); // Ensure the workout has an ID
        return userWorkout;
    }


}