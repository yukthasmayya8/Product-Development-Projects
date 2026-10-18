# StudyFlow

StudyFlow is a modern React and Firebase study companion designed to help students organize their study routines, maintain focus, monitor wellbeing, and gain insights into their learning habits.

The application combines study planning, focus sessions, productivity analytics, wellbeing tools, and an AI-powered assistant in a single platform.

> **Project context:** StudyFlow was developed as part of a Product Development Masterclass.

## Features

### Study Management

- Create and organize study plans
- Manage focus sessions and study timers
- Review study history and productivity trends
- Track learning progress over time

### Wellbeing Support

- Record and monitor mood
- Access balance and motivation tools
- Practice mindfulness activities
- Encourage healthy and sustainable study habits

### AI Study Assistant

- Get AI-powered study guidance
- Ask questions related to learning and productivity
- Receive personalized suggestions and support
- Explore effective study strategies

### User Experience

- Responsive and accessible interface
- Reusable component-based architecture
- Profile and settings management
- Support for multiple languages and translations
- Sound and interaction enhancements

## Technology Stack

- **Frontend:** React and TypeScript
- **Build tool:** Vite
- **Backend services:** Firebase
- **Database and services:** Firebase data operations
- **AI integration:** Google Gemini API
- **Development checks:** TypeScript and Vite build tools

## AI-Assisted Development

StudyFlow was developed with assistance from **Google AI Studio**.

Google AI Studio supported the development process through:

- Product ideation and feature exploration
- User-experience planning
- Code-generation assistance
- Debugging and implementation guidance
- Iterative refinement of application functionality

The final application structure, implementation decisions, testing, and refinements were reviewed and adapted during development.

## Project Development

StudyFlow was created during a **Product Development Masterclass**, which focused on transforming a product idea into a functional software application.

The project explored:

- Identifying student productivity challenges
- Designing a focused digital study experience
- Combining productivity and wellbeing features
- Integrating AI-assisted functionality
- Building a scalable frontend architecture
- Connecting application features with Firebase services

## Project Structure

```text
project1/
├── src/
│   ├── components/
│   │   ├── assistant/    # AI assistant features
│   │   ├── layout/       # App shell and profile settings
│   │   ├── shared/       # Reusable UI components
│   │   ├── study/        # Timers, planning, history, and analytics
│   │   └── wellbeing/    # Mood, balance, motivation, and mindfulness features
│   ├── lib/              # AI, translations, sound, and experiment helpers
│   ├── App.tsx           # Application composition and routing state
│   └── firebase.ts       # Firebase services and data operations
├── .env.local            # Local environment variables
├── package.json          # Dependencies and npm scripts
└── README.md             # Project documentation
```

## Prerequisites

Before running the project locally, install:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- A Firebase project, if Firebase services are required
- A Gemini API key for AI assistant functionality

Verify your Node.js and npm installations:

```bash
node --version
npm --version
```

## Run Locally

### 1. Navigate to the project directory

From the repository root:

```bash
cd project1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the `project1` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Add any required Firebase configuration values used by the project.

> Do not commit `.env.local` or expose private API keys in the repository.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

```text
http://localhost:5173
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run lint` | Runs the TypeScript validation check. |
| `npm run build` | Creates an optimized production build. |

## Production Build

Create a production-ready build with:

```bash
npm run build
```

The generated files will be placed in the `dist/` directory.

## Security Notes

- Never commit `.env.local` or files containing API keys.
- Use separate development and production credentials.
- Configure Firebase security rules before deployment.
- Review AI-generated code and recommendations before using them in production.
- Avoid sending sensitive personal or academic information to external AI services.

## Project Status

StudyFlow is an educational product-development project created to demonstrate the design and implementation of a student-focused productivity application.

## License

No formal open-source license has been specified for this project. Please contact the repository owner before redistributing or using the project beyond personal, educational, or demonstration purposes.
