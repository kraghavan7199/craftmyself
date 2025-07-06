// import { logger } from 'firebase-functions';
import * as express from 'express';
import { controller, httpGet, request, response } from 'inversify-express-utils';
import TYPES from '../config/types';
// import { FirestoreRepository } from '../repository/firestore.repository';
import { PostgresRepository } from '../repository/postgres.repository';
import { inject } from 'inversify';
import { authMiddleware } from '../middlewares/AuthMiddleware';


@controller('/exercises', authMiddleware)
export class ExerciseController {


    private postgresRepo: PostgresRepository;

    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.postgresRepo = postgresRepo;
    }

    @httpGet('')
    public async getExercises(@request() req: express.Request, @response() res: express.Response) {
        try {
            const skip = req.query.skip ? +req.query.skip : 0;
            const limit = req.query.limit ? +req.query.limit : 10;
            const searchQuery = req.query.searchQuery as string;
            
            const exercises = await this.postgresRepo.getExercises(limit, skip, searchQuery);
            
            // Get total count for pagination
            const totalExercises = await this.postgresRepo.getExercises(10000, 0, searchQuery);
            
            res.status(200).json({
                data: exercises,
                total: totalExercises.length,
                page: limit ? Math.floor(skip / limit) + 1 : 1,
                limit: limit
            });
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ error: 'Failed to fetch exercises' });
        }
    }

    @httpGet('/prs/user/:userId')
    public async getUserExercisePRs(@request() req: express.Request, @response() res: express.Response) {
        try {
            const userId = req.params.userId;
            const skip = req.query.skip ? +req.query.skip : 0;
            const limit = req.query.limit ? +req.query.limit : 10;
            const searchQuery = req.query.searchQuery as string;
            
            if (!userId) {
             res.status(400).json({ error: 'User ID is required' });
            }

            const searchCriteria = {
                userId: userId, 
                skip: skip, 
                limit: limit,
                searchQuery: searchQuery
            };

            const exercisePRs = await this.postgresRepo.getUserExercisePRs(searchCriteria);
            
            // Get total count with same search criteria but no pagination
            const totalCountCriteria = {
                userId: userId, 
                skip: 0, 
                limit: 10000,
                searchQuery: searchQuery
            };
            const totalExercisePRs = await this.postgresRepo.getUserExercisePRs(totalCountCriteria);
            
            res.status(200).json({
                data: exercisePRs,
                total: totalExercisePRs.length,
                page: Math.floor(skip / limit) + 1,
                limit: limit
            });
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ error: 'Failed to fetch exercise PRs' });
        }
    }


} 