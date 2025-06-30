import { controller, httpDelete, httpGet, httpPost, httpPut, request, requestParam, response } from "inversify-express-utils";
import * as express from 'express';
import { authMiddleware } from "../middlewares/AuthMiddleware";
import { PostgresRepository } from "../repository/postgres.repository";
import { inject } from "inversify";
import TYPES from "../config/types";
// import { logger } from "firebase-functions";
import { UserMacros } from "../domain/models/UserMacros";
import { UserMacrosSearchCriteria } from "../domain/models/UserMacrosSearchCriteria";
import { IAnalysisService } from "../domain/services/IAnalysisService";
import { IMacrosService } from "../domain/services/IMacrosService";





@controller('/macros', authMiddleware)
export class MacrosController {

    private postgresRepo: PostgresRepository;
    private analysisService: IAnalysisService;
    private macrosService: IMacrosService;

    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository,
@inject(TYPES.AnalysisService) analysisService: IAnalysisService,
@inject(TYPES.MacrosService) macrosService: IMacrosService) {
        this.postgresRepo = postgresRepo;
        this.analysisService = analysisService;
        this.macrosService = macrosService;
    }

    @httpGet('/calculation')
    public async getMacrosCalculations(@request() req: express.Request, @response() res: express.Response) {
        try {

            const {prompt} = req.query;
            const result = await this.analysisService.calculateMacros(prompt as string);
            res.status(200).json(result)

        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to calculate macros' });
        }
    }

    @httpPost('')
        public async addUserMacros(@request() req: express.Request, @response() res: express.Response) {
            try {
                const payload = <UserMacros>req.body
                const result = this.macrosService.upsertMacros(payload);
                res.status(200).json(!!result)
            } catch (error) {
                console.log(error)
                res.status(500).json({ error: 'Failed to add macros' });
            }
        }

    @httpGet('/user/:userId/current')
        public async getCurrentUserMacros(@requestParam('userId') userId: string, @request() req: express.Request, @response() res: express.Response) {
            try {
                const workout = await this.postgresRepo.getCurrentDayMacros(userId);
                res.status(200).json(workout);
            }
            catch (error) {
                console.log(error)
                res.status(500).json({ error: 'Failed to get current macros' });
            }
        }

    @httpGet('/user/:userId/history')
        public async getUserMacrosHistory(@requestParam('userId') userId: string, @request() req: express.Request, @response() res: express.Response) {
            try {
                const { criteria } = req.query;
                let searchCriteria: UserMacrosSearchCriteria;

                if (criteria) {
                    const parsedCriteria = JSON.parse(criteria as string);
                    searchCriteria = {
                        userId,
                        date: parsedCriteria.date ? new Date(parsedCriteria.date) : undefined,
                        weekStart: parsedCriteria.startDate ? new Date(parsedCriteria.startDate) : undefined,
                        weekEnd: parsedCriteria.endDate ? new Date(parsedCriteria.endDate) : undefined,
                        skip: parsedCriteria.skip || 0,
                        limit: parsedCriteria.limit || 5
                    };
                } else {
                    searchCriteria = {
                        userId,
                        skip: 0,
                        limit: 5
                    };
                }

                const userMacros = await this.postgresRepo.getUserMacros(searchCriteria);
                res.status(200).json(userMacros);
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Failed to get user macros history' });
            }
        }
    
    @httpDelete('/:macrosId')
    public async deleteMacros(@requestParam('macrosId') macrosId: string, @request() req: express.Request, @response() res: express.Response) {
        try {
            const isDeleted = await this.postgresRepo.deleteUserMacros(macrosId);
            res.status(200).json(isDeleted);
        }
        catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to delete macros' });
        }
    }

    @httpPut('/:macrosId')
    public async updateMacros(@requestParam('macrosId') macrosId: string, @request() req: express.Request, @response() res: express.Response) {
        try {
            const payload = <UserMacros>req.body;
            const result = this.macrosService.upsertMacros(payload);
            res.status(200).json(!!result)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to update macros' });
        }
    }
}