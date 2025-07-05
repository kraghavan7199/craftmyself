// import { logger } from 'firebase-functions';
import * as express from 'express';
import { controller, httpDelete, httpGet, httpPost, httpPut, request, requestParam, response } from 'inversify-express-utils';
import TYPES from '../config/types';
import { PostgresRepository } from '../repository/postgres.repository';
import { inject } from 'inversify';
import { UserWorkout } from '../domain/models/UserWorkout';
import { UserWorkoutSearchCriteria } from '../domain/models/UserWorkoutSearchCriteria';
import { IAnalysisService } from '../domain/services/IAnalysisService';
import { IWorkoutService } from '../domain/services/IWorkoutService';
import { authMiddleware } from '../middlewares/AuthMiddleware';


@controller('/workout', authMiddleware)
export class WorkoutController {


    private postgresRepo: PostgresRepository;
    private analysisService: IAnalysisService;
    private workoutService: IWorkoutService;

    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository,
        @inject(TYPES.AnalysisService) analysisService: IAnalysisService,
        @inject(TYPES.WorkoutService) workoutService: IWorkoutService) {
        this.postgresRepo = postgresRepo;
        this.analysisService = analysisService;
        this.workoutService = workoutService;
    }

    @httpPost('')
    public async addUserWorkout(@request() req: express.Request, @response() res: express.Response) {
        try {
            const payload = <UserWorkout>req.body
            await this.workoutService.upsetWorkoutData({ ...payload });
            res.status(200).json(true)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to add workout' });
        }
    }

    @httpPut('/:workoutId')
    public async updateWorkout(@requestParam('workoutId') workoutId: string, @request() req: express.Request, @response() res: express.Response) {
        try {

            const payload = <UserWorkout>req.body;
            await this.workoutService.upsetWorkoutData(payload);
            res.status(200).json(true)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to update workout' });
        }
    }

    @httpGet('/user/:userId/current')
    public async getCurrentUserWorkout(@requestParam('userId') userId: string, @request() req: express.Request, @response() res: express.Response) {
        try {
            const workout = await this.postgresRepo.getCurrentDayUserWorkout(userId);
            res.status(200).json(workout);
        }
        catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to get workout' });
        }
    }

    @httpDelete('/:workoutId/')
    public async deleteWorkout(@requestParam('workoutId') workoutId: string, @request() req: express.Request, @response() res: express.Response) {
        try {
            
            if (!req.userId) {
                 res.status(400).json({ error: 'User ID is required' });
            }

            console.log(`Deleting workout with ID: ${workoutId} for user: ${req.userId}`);
            const isDeleted = await this.postgresRepo.deleteUserWorkout(workoutId);
            res.status(200).json(isDeleted);
        }
        catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to delete workout' });
        }
    }

    @httpGet('/prompt')
    public async getWorkoutByPrompt(@request() req: express.Request, @response() res: express.Response) {
        try {

            const { prompt } = req.query;
            const result = await this.analysisService.getWorkoutByPrompt(prompt as string);
            res.status(200).json(result)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to get workout' });
        }
    }

    @httpPost('/weekly/plan')
    public async upsertWeeklyWorkoutPlan(@request() req: express.Request, @response() res: express.Response) {
        try {
            const result = await this.postgresRepo.upsertWeeklyWorkoutPlan(req.body);
            res.status(200).json({ message: 'Weekly workout plan upserted successfully', result });
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to upsert weekly workout plan' });
        }
    }

    @httpGet('/weekly/plan/:userId')
    public async getWeeklyWorkoutPlan(@request() req: express.Request, @response() res: express.Response) {
        const { date } = req.query;
        try {
            const userId = req.params.userId;
            const result = await this.postgresRepo.getWeeklyWorkoutPlan(new Date(date as string), userId);
            res.status(200).json(result);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to get weekly workout plan' });
        }

    }

    @httpGet('/user/:userId/history')
    public async getUserWorkoutHistory(@requestParam('userId') userId: string, @request() req: express.Request, @response() res: express.Response) {
        try {
            const { criteria } = req.query;
            let searchCriteria: any;

            if (criteria) {
                
                const parsedCriteria =JSON.parse(criteria as any);
                searchCriteria = {
                    userId,
                    date: parsedCriteria.date,
                    weekStart: parsedCriteria.startDate,
                    weekEnd: parsedCriteria.endDate ,
                    skip: parsedCriteria.skip,
                    limit: parsedCriteria.workoutLimit || 5
                };
            } else {
                searchCriteria = {
                    userId,
                    skip: 0,
                    limit: 5
                };
            }

            const userWorkouts = await this.postgresRepo.getUserWorkouts(searchCriteria);
            
            // Format response to match frontend expectations
            const response = {
                userWorkouts,
                lastWorkoutTimestamp: userWorkouts.length > 0 ? userWorkouts[userWorkouts.length - 1].date : null
            };

            res.status(200).json(response);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to get user workout history' });
        }
    }
}