
const TYPES = {
    FirestoreRepository: Symbol.for('FirestoreRespository'),
    PostgresRepository: Symbol.for('PostgresRepository'),
    GeminiService: Symbol.for('GeminiService'),
    AnalysisService: Symbol.for('AnalysisService'),
    WorkoutService: Symbol.for('WorkoutService'),
    Database: Symbol.for('Database'),
    MacrosService: Symbol.for('MacrosService'),
    FirestoreToPostgresTransferWorker: Symbol.for('FirestoreToPostgresTransferWorker'),
    CronJobService: Symbol.for('CronJobService')
};
export default TYPES;