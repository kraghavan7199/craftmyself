import { controller, httpGet, request, requestParam, response } from "inversify-express-utils";
import * as express from 'express';
import { authMiddleware } from "../middlewares/AuthMiddleware";
import TYPES from "../config/types";
import { inject } from "inversify";
import { PostgresRepository } from "../repository/postgres.repository";
// import { logger } from "firebase-functions";

@controller('/summary', authMiddleware)
export class SummaryController {

    private postgresRepo: PostgresRepository;

    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.postgresRepo = postgresRepo;
    }

    @httpGet('/user/:userId/weekly')
    public async getWeeklySummary(@requestParam('userId') userId: string, @request() req: express.Request, @response() res: express.Response) {
        try {

            const result = await this.postgresRepo.getUserWeeklySummary(userId);
            res.status(200).json(result);

        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to get weekly summary' });
        }
    }

    @httpGet('/user/:userId/exercise/:exerciseId')
    public async getUserExerciseHistory(@requestParam('userId') userId: string, @requestParam('exerciseId') exerciseId: string,@request() req: express.Request, @response() res: express.Response) {
        try {
            const result = await this.postgresRepo.getUserExerciseHistory(exerciseId,userId);
            res.status(200).json(result);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to get user Exercise History' });
        }
    }


} 