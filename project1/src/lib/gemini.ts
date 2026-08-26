import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateMotivation(
  mood: string,
  studyHistory: any[],
  language: string = "English",
) {
  const prompt = `The student is currently feeling "${mood}". 
  Their recent study history includes: ${JSON.stringify(studyHistory)}.
  The student's preferred language is "${language}".
  
  Provide a short, powerful, and unique motivational quote from a "great person" or "rishi" found in ancient texts like:
  - Mahabharata, Ramayana, Bhagavata, Bhagavad Gita, Vedas, Shastras, or other classical Indian texts.
  
  The quote must align with their current mood "${mood}".
  The message MUST be in "${language}" (if Kannada or Hindi, use the native script).
  The response MUST follow this format:
  "Quote text here" — Source Name
  
  CRITICAL: 
  - Keep the quote extremely concise (MAX 15 words).
  - It must be deeply relevant to focus, discipline, or overcoming mental fatigue.
  - Avoid generic or nonsensical output.
  - Examples of good output:
    "Focus on your duty, not the fruits of your action." — Bhagavad Gita
    "The mind is the friend of those who have conquered it." — Bhagavad Gita
    "Truth alone triumphs, not falsehood." — Mundaka Upanishad`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction:
        "You are a supportive and wise study mentor. You provide extremely short, punchy, and profound quotes from ancient Indian wisdom. You always respond in the user's preferred language.",
    },
  });

  return response.text;
}

export async function generateTimetable(
  mood: string,
  subjects: string[],
  weakSubjects: string[],
  strongSubjects: string[],
  pattern: string,
  duration: string = "daily",
  focusSubject?: string,
  language: string = "English",
  syllabus: Record<string, string> = {},
  distractionLogs: any[] = [],
  studyMode: "exam" | "mastery" = "exam",
) {
  const prompt = `Create a study timetable for a student who is feeling "${mood}". 
  Subjects to study: ${subjects.join(", ")}. 
  Syllabus for each subject: ${JSON.stringify(syllabus)}.
  Weak subjects (need more focus): ${weakSubjects.join(", ")}.
  Strong subjects (can be reviewed quickly): ${strongSubjects.join(", ")}.
  Preferred study pattern: ${pattern}.
  Timetable duration: ${duration}.
  Study Mode: ${studyMode === "exam" ? "Exam Focus (Prioritize most important/exam-relevant topics from syllabus)" : "Mastery Mode (Focus deeply on one topic at a time for complete understanding)"}.
  ${focusSubject ? `Today's special focus: ${focusSubject}.` : ""}
  The student's preferred language is "${language}".
  
  REALISTIC PLANNING CONTEXT:
  Recent distractions logged: ${JSON.stringify(distractionLogs.slice(0, 5))}.
  If distractions are frequent or recent, the student's "mindset" might be fragile. 
  In this case, DO NOT burden them with long 2-hour blocks. 
  Instead, use "Micro-Focus" blocks (25-45 mins) with frequent "Mindful Breaks".
  
  The goal is to maximize focus and minimize digital distractions. 
  Include breaks and specific focus techniques (like Pomodoro). 
  For each activity, determine if it "aligns" with the current mood "${mood}" (e.g., if they are tired, light study aligns; if energetic, deep work aligns).
  Return the schedule as a JSON array of objects with "time", "activity", "tip", and "moodAlign" (boolean) fields.
  All text must be in "${language}".`;

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
            tip: { type: Type.STRING },
            moodAlign: { type: Type.BOOLEAN },
          },
          required: ["time", "activity", "tip", "moodAlign"],
        },
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generateFlashcards(
  subject: string,
  concept: string,
  language: string = "English",
) {
  const prompt = `Create 5 study flashcards for the concept "${concept}" in the subject "${subject}".
  The student's preferred language is "${language}".
  Each flashcard should have a "concept" (the question or term) and an "explanation" (the answer or definition).
  The explanation should be concise and easy to memorize.
  Return as a JSON array of objects with "concept" and "explanation" fields.
  All text must be in "${language}".`;

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
            concept: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["concept", "explanation"],
        },
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generateQuiz(
  subject: string,
  concept: string,
  language: string = "English",
) {
  const prompt = `Create a 5-question multiple-choice quiz for the concept "${concept}" in the subject "${subject}".
  The student's preferred language is "${language}".
  Each question should have "question", "options" (array of 4 strings), and "answer" (the correct option string).
  Return as a JSON array of objects with "question", "options", and "answer" fields.
  All text must be in "${language}".`;

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
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
          },
          required: ["question", "options", "answer"],
        },
      },
    },
  });

  return JSON.parse(response.text);
}
