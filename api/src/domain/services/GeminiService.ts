import { GoogleGenAI } from "@google/genai";
// import { defineString } from "firebase-functions/params";
import { injectable } from "inversify";
import { IGeminiService } from "./IGeminiService";
// import { logger } from "firebase-functions";

// const GEMINI_API_KEY = defineString('API_KEY');
const GEMINI_API_KEY = { value: () => process.env.API_KEY || '' };




@injectable()
export class GeminiService implements IGeminiService {

    async genGeminiResponse(prompt: string): Promise<string | null> {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("Generating response with Gemini AI for prompt:", prompt);
        const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: [{ parts: [{ text: prompt }]}]});
        console.log("Gemini AI response received:", response);
        return response.text?? null;
    }
}