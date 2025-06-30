

export interface IAnalysisService {
    calculateMacros(input: string): Promise<any>;
    getMacrosAnalysis(userId: string): Promise<any>;
    getWorkoutAnalysis(userId: string): Promise<any>;
    getWorkoutByPrompt(prompt: string): Promise<any>;
    generateComprehensiveAnalysis(userId: string): Promise<any>;
}