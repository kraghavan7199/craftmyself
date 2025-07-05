import { controller, httpGet, request, requestParam, response } from "inversify-express-utils";
import * as express from 'express';
import { authMiddleware } from "../middlewares/AuthMiddleware";
import TYPES from "../config/types";
import { inject } from "inversify";
import { PostgresRepository } from "../repository/postgres.repository";

@controller('/analytics', authMiddleware)
export class AnalyticsController {

    private postgresRepo: PostgresRepository;

    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.postgresRepo = postgresRepo;
    }

    @httpGet('/user/:userId/comprehensive')
    public async getComprehensiveAnalytics(
        @requestParam('userId') userId: string, 
        @request() req: express.Request, 
        @response() res: express.Response
    ) {
        try {
            const { startDate, endDate } = req.query;
            
            const result = await this.postgresRepo.getComprehensiveWorkoutAnalytics(
                userId, 
                startDate as string, 
                endDate as string
            );
            
            res.status(200).json(result);

        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to get comprehensive analytics' });
        }
    }
}