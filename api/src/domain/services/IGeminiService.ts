
export interface IGeminiService {
    genGeminiResponse(prompt: string): Promise<string| null>
}