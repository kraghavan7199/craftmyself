import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import TYPES from '../../config/types';
import { PostgresRepository } from '../../repository/postgres.repository';
import { IWorkoutService } from './IWorkoutService';


@injectable()
export class CronJobService {
    constructor(
        @inject(TYPES.PostgresRepository) private postgresRepo: PostgresRepository,
        @inject(TYPES.WorkoutService) private workoutService: IWorkoutService
    ) {}

    public startCronJobs(): void {
        cron.schedule('30 5 * * *', async () => {
            console.log('Running daily workout creation job at 5:30 AM');
            await this.createDailyWorkouts();
        }, {timezone: 'Asia/Kolkata', scheduled: true});

        console.log('Cron jobs started successfully');
    }

    private async createDailyWorkouts(): Promise<void> {
        try {
            const today = new Date();
            const usersWithPlannedExercises = await this.postgresRepo.getUsersWithPlannedExercises(today);

            for (const userPlan of usersWithPlannedExercises) {
                await this.createWorkoutFromPlan(userPlan);
            }

            console.log(`Created workouts for ${usersWithPlannedExercises.length} users`);
        } catch (error) {
            console.error('Error creating daily workouts:', error);
        }
    }

    private async createWorkoutFromPlan(userPlan: any): Promise<void> {
        try {
            const workoutData = {
                id: this.generateWorkoutId(),
                userId: userPlan.userId,
                date: new Date(),
                exercises: userPlan.exercises.map((exercise: any) => ({
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    muscleGroupCode: exercise.muscleGroupCode || '',
                    muscleGroupName: exercise.muscleGroupName || '',
                    sets: []
                }))
            };

            await this.workoutService.upsetWorkoutData(workoutData);
            console.log(`Created workout for user ${userPlan.userId}`);
        } catch (error) {
            console.error(`Error creating workout for user ${userPlan.userId}:`, error);
        }
    }

    private generateWorkoutId(): string {
        return 'workout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}