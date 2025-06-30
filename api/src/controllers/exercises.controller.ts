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
            const exercises = await this.postgresRepo.getExercises();
            res.status(200).json(exercises);
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
            if (!userId) {
             res.status(400).json({ error: 'User ID is required' });
            }

            const exercisePRs = await this.postgresRepo.getUserExercisePRs({userId: userId, skip: 0, limit: 10});
            res.status(200).json(exercisePRs);
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ error: 'Failed to fetch exercise PRs' });
        }
    }


} 