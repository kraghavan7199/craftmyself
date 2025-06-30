import "reflect-metadata";
import * as express from 'express';
import './src/controllers/exercises.controller';
import './src/controllers/workout.controller';
import './src/controllers/macros.controller';
import './src/controllers/summary.controller';
import './src/controllers/export.controller';
import './src/controllers/user.controller';
import { InversifyExpressServer } from "inversify-express-utils";
import {container} from "./src/config/inversify.config";
import { Database } from "./src/config/Database";
import TYPES from "./src/config/types";
import { cert, initializeApp } from 'firebase-admin/app';

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
});


initializeApp({credential: cert({
  "projectId": "craftmyself-31d3d",
  "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcnD5DSZ7yRIQ7\nh8ad7glARAGK/kvBJkN4bFwMfDxBNHRmBzEMj1DVxZUcRdBrB9NhsvxkPLRtmIPM\nNe6yD2bDkVJV7oP7i+cyaXCqISxaafgv9yx6ERpSvNmDCgpUyixU2YNg0DiAoHa7\nJurMgVP8tj2mWWnsBEknUHnrcNGOS5BXfFzul06Uwdv9norcCNpiM6kvoyW1QCiG\n9Xc8NIvFJcsO09fqeKFS1io5sxFA7E/qYhnZsfTPA4qmNNKAVjpZhA5EedhgH9K7\nbFGXnUEUkM8p5Ljv/+fd4ADexa7MfCEypNDdUrXzLmgAFd0T9LuuV8oXNyyhUAbZ\nU6QyN+pZAgMBAAECggEAKFEhi9iDhNECvYJlyOz8odML2SP6IjVk9TgQZnO560yz\nzQWZcCss4bR3OLCFk1ndxqgYOhVh//l0dLiSg9YOuMTxICUz15/Mw8jDP0RKv8dI\nBTQN280OW3qJ4cnO84nzKhqKSQIkoVUx/afyFye3eqKvh5wloG10FQw/C8kVcwSD\nJ2jGflv/bxAbjk+Z0XKHH4G/IfS7Qr3T5lxd8sLPRMUffhWR7F5NKnwUO7iEGXLx\n3sD5NlLed6P7w/Yny1SFD7nLXzfEsUyzkl4wyt2hq1WaIqOYkOBmQcYloNAVEXpq\nP/GDSIDF6DIDpWGvy95FgGnimL03EoLEgD6iYgao1QKBgQD/qdPg34st0VmUfnH2\nM15n3sT91IgU6qLSZiH5rj9nlf4o3eQjj1mk6WvaTMo8YDP2tr6wVkHTSVU0en5k\nLofH6IRIfkSjVd1J7gOCi4f4Cj7P2s0SUvYyjKfLnJfpfzkU3To2F5dhGngSwVe2\nxfkikCPENZddFkXRqhuc3ZfR7wKBgQDc5pnNcwElYP0NdOPG7h/474ZhlAHL6dG2\nDVO6ygZIbDEC4lIBOCBioNVnSrSNyaKKMrOB+wv/LyXwQl7+b6NkDR696IK2Wme1\nAMFsVufPjK0mDi8zcEfnlf5RXdfkLPn0McTn+dzLeX3NJX4bwValDTPPG2csP9O+\n65D5nZMwNwKBgQD1Z1Nsp8bVvPzqj5DeTSKSO4AFUcspoKuXn9d+7aYIzS4AljTV\neVUH+dK/4TPCTmmyqGlTpAhdQifaTrYhfZRx7BuF5kYGLnZR73hJB5wFF/iA1bpA\nm4ecr+ykgfRDeg4Vm+CzaWOyHpEhF5sVYuSoK4lZXkOjY6yy+0C0CvQe2wKBgCTj\nXUuxqL9VMuzMWD0gBrbLSOWCkco7gYmlMBZBJktxxb11jbwmY0IVGY3mK8CBq2Lo\nlJFgGuDCPtOgQby7Z82NY1TTPwC0mBzhw2sUGCHQnBl+xOMSHO/PXGi6AxNXb2YX\n6YnTb8uKvjdDy4tW/eESE1TCfrgk8HcxX0RPzASBAoGAZChOYv7ABRXnwCGugjD4\nDrWfN7ZlGOX8kf7P+CartLT3Xkc0nJdirRHAGNK5hQZcpnlXXknCuXMh262yxBQP\n9QDPViuDpWED018P4oDxFeP9yBg+B4J3J9/13EkYQstnq0O+2yu4aW44YOD5Z6BT\nZ7ZC6+vzxzU8KvL/T1wLFM4=\n-----END PRIVATE KEY-----\n",
  "clientEmail": "firebase-adminsdk-fbsvc@craftmyself-31d3d.iam.gserviceaccount.com"
})})


const app = server.build();

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        const database = container.get<Database>(TYPES.Database);
        await database.connect();
        
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