
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function suggestTasksForProject(projectName: string, subject: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Propose une liste de 5 à 8 tâches essentielles pour un projet de graphisme nommé "${projectName}" dont le sujet est "${subject}". Réponds uniquement en JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.tasks as string[];
  } catch (error) {
    console.error("Gemini Task Suggestion Error:", error);
    return [];
  }
}
