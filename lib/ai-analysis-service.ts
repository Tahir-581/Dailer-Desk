import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalyticsService } from "./analytics/service";
import { TranscriptionService } from "./transcription-service";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export class AIAnalysisService {
  static async analyzeCall(sessionId: string, orgId: string) {
    const transcriptData = await TranscriptionService.getTranscript(sessionId);
    if (!transcriptData.text && (!transcriptData.segments || transcriptData.segments.length === 0)) {
      return null;
    }

    const transcript = transcriptData.text || transcriptData.segments.map(s => `[${s.speaker}]: ${s.text}`).join('\n');
    const definitions = await AnalyticsService.getAnalysisDefinitions(orgId);
    const customFieldsPrompt = definitions.map(d => `"${d.fieldKey}": "${d.description || d.name} (${d.type})"`).join(',\n');
    const customFieldsInstructions = definitions.map(d => `- ${d.fieldKey}: ${d.analysisPrompt || d.description}`).join('\n');

    const prompt = `
      Analyze the following call transcript and provide the requested information in JSON format.
      
      Transcript:
      ${transcript}
      
      Required Output (JSON):
      {
        "summary": "Brief summary of the call",
        "actionItems": ["item 1", "item 2"],
        "keyPoints": ["point 1", "point 2"],
        "customAnalysis": {
          ${customFieldsPrompt}
        }
      }
      
      For custom analysis fields:
      ${customFieldsInstructions}
    `;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      
      const analysisResult = JSON.parse(jsonMatch[0]);
      const dbAnalysis: any = {
        summary: analysisResult.summary,
        actionItems: Array.isArray(analysisResult.actionItems) ? analysisResult.actionItems.join('\n') : analysisResult.actionItems,
        keyPoints: Array.isArray(analysisResult.keyPoints) ? analysisResult.keyPoints.join('\n') : analysisResult.keyPoints,
        booleanAnalysis: {},
        textAnalysis: {},
        numberAnalysis: {},
        selectorAnalysis: {}
      };
      if (analysisResult.customAnalysis) {
        for (const def of definitions) {
          const value = analysisResult.customAnalysis[def.fieldKey];
          if (value !== undefined) {
            if (def.type === 'boolean') {
              dbAnalysis.booleanAnalysis[def.fieldKey] = Boolean(value);
            } else if (def.type === 'number') {
              dbAnalysis.numberAnalysis[def.fieldKey] = Number(value);
            } else if (def.type === 'selector') {
              dbAnalysis.selectorAnalysis[def.fieldKey] = String(value);
            } else {
              dbAnalysis.textAnalysis[def.fieldKey] = String(value);
            }
          }
        }
      }

      await AnalyticsService.saveCallAnalysis(sessionId, orgId, dbAnalysis);
      return dbAnalysis;
      
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return null;
    }
  }
}
