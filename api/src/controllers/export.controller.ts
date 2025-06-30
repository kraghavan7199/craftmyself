// import { logger } from 'firebase-functions';
import * as express from 'express';
import { controller, httpGet, request, requestParam, response } from 'inversify-express-utils';
import TYPES from '../config/types';
import { PostgresRepository } from '../repository/postgres.repository';
import { inject } from 'inversify';

interface UserExportData {
    userId: string;
    exportDate: string;
    exercises?: any[];
    workouts?: any[];
    macros?: any[];
    workoutSummaries?: any[];
    macroSummaries?: any[];
    exerciseSummaries?: any[];
    weeklySummaries?: any[];
    weeklyWorkoutPlans?: any[];
}

@controller('/export')
export class ExportController {

    private postgresRepo: PostgresRepository;

    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.postgresRepo = postgresRepo;
    }

    @httpGet('/user/:userId')
    public async exportUserData(@requestParam('userId') userId: string, @request() req: express.Request, @response() res: express.Response) {
        // try {
        //     const exportData: UserExportData = {
        //         userId: userId,
        //         exportDate: new Date().toISOString()
        //     };

        //     // Get all user workouts
        //     const workoutsQuery = await db.collection('userWorkouts').where('userId', '==', userId).get();
        //     if (!workoutsQuery.empty) {
        //         exportData.workouts = workoutsQuery.docs.map(doc => ({
        //             id: doc.id,
        //             ...doc.data()
        //         }));
        //     }

        //     // Get all user macros
        //     const macrosQuery = await db.collection('userMacros').where('userId', '==', userId).get();
        //     if (!macrosQuery.empty) {
        //         exportData.macros = macrosQuery.docs.map(doc => ({
        //             id: doc.id,
        //             ...doc.data()
        //         }));
        //     }

        //     // Get workout summaries
        //     const workoutSummariesQuery = await db.collection('workoutSummaries').where('userId', '==', userId).get();
        //     if (!workoutSummariesQuery.empty) {
        //         exportData.workoutSummaries = workoutSummariesQuery.docs.map(doc => ({
        //             id: doc.id,
        //             ...doc.data()
        //         }));
        //     }

        //     // Get macro summaries
        //     const macroSummariesQuery = await db.collection('userMacroSummary').where('userId', '==', userId).get();
        //     if (!macroSummariesQuery.empty) {
        //         exportData.macroSummaries = macroSummariesQuery.docs.map(doc => ({
        //             id: doc.id,
        //             ...doc.data()
        //         }));
        //     }

        //     // Get exercise summaries
        //     const exerciseSummariesQuery = await db.collection('userExerciseSummary').where('userId', '==', userId).get();
        //     if (!exerciseSummariesQuery.empty) {
        //         exportData.exerciseSummaries = exerciseSummariesQuery.docs.map(doc => ({
        //             id: doc.id,
        //             ...doc.data()
        //         }));
        //     }

        //     // Get weekly summaries
        //     const weeklySummariesQuery = await db.collection('weeklySummary').where('userId', '==', userId).get();
        //     if (!weeklySummariesQuery.empty) {
        //         exportData.weeklySummaries = weeklySummariesQuery.docs.map(doc => ({
        //             id: doc.id,
        //             ...doc.data()
        //         }));
        //     }

        //     // Get weekly workout plans
        //     const weeklyWorkoutPlansQuery = await db.collection('weeklyWorkoutPlans').where('userId', '==', userId).get();
        //     if (!weeklyWorkoutPlansQuery.empty) {
        //         exportData.weeklyWorkoutPlans = weeklyWorkoutPlansQuery.docs.map(doc => ({
        //             id: doc.id,
        //             ...doc.data()
        //         }));
        //     }

        //     // Get all exercises (reference data)
        //     const exercises = await this.postgresRepo.getExercises();
        //     exportData.exercises = exercises;

        //     res.setHeader('Content-Type', 'application/json');
        //     res.setHeader('Content-Disposition', `attachment; filename="user_${userId}_export_${new Date().toISOString().split('T')[0]}.json"`);
        //     res.status(200).json(exportData);

        // } catch (error) {
        //     console.log('Failed to export user data:', error);
        //     res.status(500).json({ error: 'Failed to export user data' });
        // }
    }
}