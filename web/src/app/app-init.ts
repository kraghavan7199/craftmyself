import { AppInitializerService } from "./services/app-initializer.service";


export function initializeApps(appInitializer: AppInitializerService) {
    return (): Promise<any> => {
      return appInitializer.initializeApp();
    };
  }