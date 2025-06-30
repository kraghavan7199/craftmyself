import { inject, injectable } from "inversify";
import TYPES from "../../config/types";
import { IGeminiService } from "./IGeminiService";
// import { logger } from "firebase-functions/v2";
// import { HttpsError } from "firebase-functions/https";
// import { FirestoreRepository } from "../../repository/firestore.repository";
import { PostgresRepository } from "../../repository/postgres.repository";
import { macroCalculationPrompt } from "../prompts/macroCalculationPrompt";
import { macroAnalysisPrompt } from "../prompts/macroAnalysisPrompt";
import { workoutAnalysisPrompt } from "../prompts/workoutAnalysisPrompt";
import { Macros } from "../models/UserMacros";
import { IAnalysisService } from "./IAnalysisService";
import { exercisePrompt } from "../prompts/exercisesPrompt";
import { comprehensiveAnalysisPrompt } from "../prompts/comprehensiveAnalysisPrompt";


@injectable()
export class AnalysisService implements IAnalysisService {
    geminiService!: IGeminiService;
    postgresRepo!: PostgresRepository;

    constructor(@inject(TYPES.GeminiService) geminiService: IGeminiService,
        @inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.geminiService = geminiService;
        this.postgresRepo = postgresRepo;
    }

    async calculateMacros(input: string): Promise<Macros| null> {
        const prompt = macroCalculationPrompt.replace('{{text}}', input);
        const response = await this.geminiService.genGeminiResponse(prompt);
        return response ? <Macros>this.extractJSONFromGeminiResponse(response) : null;
    }

    async getWorkoutAnalysis(userId: string) {
        // const userWorkoutHistory = await this.postgresRepo.getUserWorkoutHistory(userId);
        // const weeklySummary = await this.postgresRepo.getUserWeeklySummary(userId);
        // const userData = { weekly_summaries: weeklySummary, daily_workouts: userWorkoutHistory };
        // const prompt = workoutAnalysisPrompt.replace('{{text}}', JSON.stringify(userData, null, 2) );
        // const response = await this.geminiService.genGeminiResponse(prompt);
        // return response ? this.extractJSONFromGeminiResponse(response) : null;
    }

    async getMacrosAnalysis(userId: string) {

        // const userMacrosSummary = await this.postgresRepo.getUserMacrosHistory(userId);
        // const prompt = macroAnalysisPrompt.replace('{{text}}', JSON.stringify(userMacrosSummary, null, 2));
        // const response = await this.geminiService.genGeminiResponse(prompt);
        // return response ? this.extractJSONFromGeminiResponse(response) : null;

    }

    async getWorkoutByPrompt(prompt: string) {
        const exercises = await this.postgresRepo.getExercises();
        const modifiedPrompt = exercisePrompt.replace('{{text}}', JSON.stringify(exercises, null, 2)).replace('{{prompt}}', prompt);
        const response = await this.geminiService.genGeminiResponse(modifiedPrompt);
        return response ? this.extractJSONFromGeminiResponse(response) : null;
    }

    async generateComprehensiveAnalysis(userId: string) {
   
    }

    private extractJSONFromGeminiResponse(response: string) {

        let cleanedJsonText = response.trim();
        if (cleanedJsonText.startsWith("```json")) {
            cleanedJsonText = cleanedJsonText.substring(7);
            if (cleanedJsonText.endsWith("```")) {
                cleanedJsonText = cleanedJsonText.substring(0, cleanedJsonText.length - 3);
            }
        }
        cleanedJsonText = cleanedJsonText.trim();
        let insightsJSON;
        try {
            insightsJSON = JSON.parse(cleanedJsonText);
        } catch (parseError) {

            console.error("Error parsing JSON response:", parseError);
            throw new Error('Error Getting Gemini Response')
        }

        return insightsJSON;
    }

    private getDateRange(data: any[]): { start: string | null, end: string | null } {
        if (!data || data.length === 0) {
            return { start: null, end: null };
        }
        
        const dates = data.map(item => new Date(item.date?.toDate ? item.date.toDate() : item.date))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());
        
        return {
            start: dates.length > 0 ? dates[0].toISOString() : null,
            end: dates.length > 0 ? dates[dates.length - 1].toISOString() : null
        };
    }

    private calculateDataPeriod(workoutHistory: any, macroHistory: any): string {
        const workoutRange = this.getDateRange(workoutHistory.userWorkouts);
        const macroRange = this.getDateRange(macroHistory.userMacros);
        
        const allDates = [
            workoutRange.start,
            workoutRange.end,
            macroRange.start,
            macroRange.end
        ].filter(date => date !== null).map(date => new Date(date!));
        
        if (allDates.length === 0) {
            return 'No data available';
        }
        
        const earliest = new Date(Math.min(...allDates.map(d => d.getTime())));
        const latest = new Date(Math.max(...allDates.map(d => d.getTime())));
        const daysDiff = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
        
        return `${daysDiff} days (${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()})`;
    }

}

