// import { logger } from 'firebase-functions';
import * as express from 'express';
import { controller, httpGet, httpPost, request, response } from 'inversify-express-utils';
import TYPES from '../config/types';
import { PostgresRepository } from '../repository/postgres.repository';
import { inject } from 'inversify';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { getAuth } from 'firebase-admin/auth';
import { User } from '../domain/models/User';

@controller('/user')
export class UserController {

    private postgresRepo: PostgresRepository;

    constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.postgresRepo = postgresRepo;
    }

    @httpGet('/:userId', authMiddleware)
    public async getUserData(@request() req: express.Request, @response() res: express.Response) {
        try {
            const userId = req.params.userId;
            if (!userId) {
                res.status(400).json({ error: 'User ID is required' });
            }

            const userData = await this.postgresRepo.getUserData(userId);
            if (!userData) {
                res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json(userData);
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ error: 'Failed to fetch user data' });
        }
    }

    @httpPost('')
    async appendUser(@request() req: express.Request, @response() res: express.Response) {
        const userId = req.body.userId;
        const authUser = await getAuth().getUser(userId);
        const newUser: User = {
            id: userId,
            email: authUser.email || "",
            displayName: authUser.displayName || undefined,
            createdAt: new Date(),
            lastLoginAt: new Date()
        };

        await this.postgresRepo.appendUser(newUser);
        res.status(200).json(true);
    }


}