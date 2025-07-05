import "reflect-metadata";
import * as express from 'express';
import './src/controllers/exercises.controller';
import './src/controllers/workout.controller';
import './src/controllers/macros.controller';
import './src/controllers/summary.controller';
import './src/controllers/export.controller';
import './src/controllers/user.controller';
import './src/controllers/analytics.controller';
import { InversifyExpressServer } from "inversify-express-utils";
import {container} from "./src/config/inversify.config";
import { Database } from "./src/config/Database";
import TYPES from "./src/config/types";
import { cert, initializeApp } from 'firebase-admin/app';
import { CronJobService } from "./src/domain/services/CronJobService";

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Add CORS middleware
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });
});


initializeApp();




const app = server.build();

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        const database = container.get<Database>(TYPES.Database);
        await database.connect();
        
        // Start cron jobs
        const cronJobService = container.get<CronJobService>(TYPES.CronJobService);
        cronJobService.startCronJobs();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 API endpoints available at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;