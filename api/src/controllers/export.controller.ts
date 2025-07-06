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
        try {
            const exportData = await this.postgresRepo.exportUserData(userId);
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}-${new Date().toISOString().split('T')[0]}.json"`);
            
            return res.json(exportData);
        } catch (error) {
            console.error('Error exporting user data:', error);
            return res.status(500).json({ error: 'Failed to export user data' });
        }
    }
}