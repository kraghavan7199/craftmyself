
import { Container } from "inversify";
// import { FirestoreRepository } from "../repository/firestore.repository";
import { PostgresRepository } from "../repository/postgres.repository";
import TYPES from "./types";
import { IGeminiService } from "../domain/services/IGeminiService";
import { GeminiService } from "../domain/services/GeminiService";
import { IAnalysisService } from "../domain/services/IAnalysisService";
import { AnalysisService } from "../domain/services/AnalysisService";
import getDecorators from "inversify-inject-decorators";
import { IWorkoutService } from "../domain/services/IWorkoutService";
import { WorkoutService } from "../domain/services/WorkoutService";
import { Database } from "./Database";
import { IMacrosService } from "../domain/services/IMacrosService";
import { MacrosService } from "../domain/services/MacrosService";


const container = new Container();

const { lazyInject } = getDecorators(container);

// container.bind<FirestoreRepository>(TYPES.FirestoreRepository).to(FirestoreRepository);
container.bind<PostgresRepository>(TYPES.PostgresRepository).to(PostgresRepository);
container.bind<IGeminiService>(TYPES.GeminiService).to(GeminiService);
container.bind<IAnalysisService>(TYPES.AnalysisService).to(AnalysisService);
container.bind<IWorkoutService>(TYPES.WorkoutService).to(WorkoutService);
container.bind<IMacrosService>(TYPES.MacrosService).to(MacrosService);
container.bind<Database>(TYPES.Database).to(Database).inSingletonScope();

 export {container, lazyInject}