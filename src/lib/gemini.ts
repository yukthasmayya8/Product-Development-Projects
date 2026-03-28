import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateMotivation(mood: string, studyHistory: any[]) {
  const prompt = `The student is currently feeling "${mood}". 
  Their recent study history includes: ${JSON.stringify(studyHistory)}.
  Provide a short, powerful, and empathetic motivational message (max 3 sentences) to help them focus and stay away from digital distractions (games, social media). 
  Make it feel personal and encouraging.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a supportive and wise study mentor who understands the struggles of digital addiction and the importance of focus.",
    },
  });

  return response.text;
}

export async function generateTimetable(mood: string, subjects: string[], pattern: string) {
  const prompt = `Create a study timetable for a student who is feeling "${mood}". 
  Subjects to study: ${subjects.join(", ")}. 
  Preferred study pattern: ${pattern}.
  The goal is to maximize focus and minimize digital distractions. 
  Include breaks and specific focus techniques (like Pomodoro). 
  Return the schedule as a JSON array of objects with "time", "activity", and "tip" fields.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            activity: { type: Type.STRING },
            tip: { type: Type.STRING }
          },
          required: ["time", "activity", "tip"]
        }
      }
    },
  });

  return JSON.parse(response.text);
}
