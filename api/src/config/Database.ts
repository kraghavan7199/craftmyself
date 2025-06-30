import { Pool, PoolClient } from 'pg';
import { injectable } from 'inversify';

@injectable()
export class Database {
    private pool: Pool;
    private static instance: Database;

    constructor() {
        this.pool = new Pool({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            user: process.env.POSTGRES_USER || 'myuser',
            password: process.env.POSTGRES_PASSWORD || 'mypassword',
            database: process.env.POSTGRES_DB || 'mydatabase',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    public async connect(): Promise<void> {
        try {
            await this.pool.connect();
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    public getPool(): Pool {
        return this.pool;
    }

    public async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    public async query(text: string, params?: any[]): Promise<any> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }

    public async close(): Promise<void> {
        await this.pool.end();
    }
}