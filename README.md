# StudyFlow

StudyFlow is a React and Firebase study companion with focus sessions, planning,
wellbeing tools, analytics, and an AI assistant.

## Run Locally

Prerequisites: Node.js

1. Install dependencies: `npm install`
2. Add `GEMINI_API_KEY` to `.env.local`.
3. Start the app: `npm run dev`

## Project Structure

```text
src/
   components/
      assistant/   AI assistant features
      layout/      App shell and profile settings
      shared/      Reusable UI components
      study/       Timers, planning, history, and analytics
      wellbeing/   Mood, balance, motivation, and mindfulness features
   lib/           AI, translations, sound, and experiment helpers
   App.tsx        Application composition and routing state
   firebase.ts    Firebase services and data operations
```

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run lint` runs the TypeScript check.
- `npm run build` creates the production bundle.
