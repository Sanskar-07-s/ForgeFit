# ForgeFit AI (v4.3) — Premium AI Fitness SaaS Platform

ForgeFit AI is a production-ready, feature-dense fitness ecosystem built on a cutting-edge serverless architecture. It provides workout generators, real-time logging timers, calorie & supplement compliance monitors, interactive 2D/3D anatomy models, automated PWA offline caching, and a conversational coach powered by Gemini AI.

---

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Three.js, Recharts
- **Platform/Backend**: Supabase (Auth, Realtime, DB Storage, Edge Functions)
- **AI Core**: Google Gemini AI API Client
- **PWA & Offline**: Service Worker, LocalStorage/IndexedDB queuing

---

## Directory Structure

```
ForgeFit-AI/
├── shared/               # Code shared between compilation environments
│   ├── constants/        # Default macros, equipment targets, subscription tiers
│   ├── enums/            # Goals, Experience Levels, Tiers
│   ├── types/            # Database schema types (matching all 27 tables)
│   ├── validation/       # Zod-style verification schemas
│   ├── feature-flags/    # Config toggle list (beta, premium, chatbot memory toggles)
│   └── fitness-models/   # Mifflin-St Jeor TDEE, BMI, and overload formulas
├── frontend/
│   ├── public/
│   │   ├── manifest.json # PWA installable setup
│   │   └── sw.js         # Service worker caching
│   ├── src/
│   │   ├── components/   # UI widgets: Mannequin3D, Recharts, SyncStatus, Search
│   │   ├── context/      # Auth, Theme, FitnessData, Notifications, Sync
│   │   ├── layouts/      # Dashboard layouts
│   │   ├── pages/        # Dashboard, Onboarding, Coach, Progress, Community, Settings
│   │   ├── services/     # Supabase client, local simulator, error boundaries, push notifications
│   │   └── utils/
├── ai/                   # Modular Advanced Fitness Intelligence Engines
│   ├── workout-planner.ts      # Adapts workouts based on equipment filters
│   ├── nutrition-planner.ts    # Caloric bulk/cut/maintain recommendations
│   ├── progression-engine.ts   # Evaluates reps/weight history for progressive overload
│   ├── recovery-engine.ts      # Recovery percentages
│   ├── readiness-engine.ts     # Calculates 0-100 fitness readiness score
│   ├── streak-engine.ts        # Counts daily/weekly/monthly streaks
│   ├── exercise-recommender.ts # Movement-pattern based substitutions
│   ├── muscle-fatigue-engine.ts# Body part exhaustion percentages
│   ├── supplement-engine.ts    # Whey and creatine tracker
│   ├── analytics-engine.ts     # Volume and trend analytics generators
│   ├── achievement-engine.ts   # XP & badge awards evaluator
│   ├── reminder-engine.ts      # Push notification triggers & schedules
│   ├── offline-sync-engine.ts  # Handles offline queue mutation and sync resolution
│   ├── search-engine.ts        # Debounced multi-entity query builder
│   └── fitness-chatbot.ts      # Chatbot client
└── supabase/
    ├── migrations/       # SQL tables, indexes, and full RLS policies
    └── seed.sql          # Seed data containing 50 exercises, milestones, challenges
```

---

## Local Development & Setup

### 1. Prerequisites
- Node.js (v18+) and npm.

### 2. Startup Environment Setup
Define your environment file inside `frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```
*Note: If these keys are omitted, the application automatically boots into **Simulator Mode** using full localStorage database state representations, allowing instant local testing without setup.*

### 3. Installation
To run the project locally, navigate to the `frontend/` folder and install dependencies:
```bash
cd frontend
npm install
npm run dev
```
To check build and compilation compliance:
```bash
npm run build
```
