## AI Food Planner

Plan weekly meals, track macros, save recipes, and manage ingredients. Future idea: AI-generated weekly meal plans.

### Features
- Weekly plan with 4 meals/day (breakfast, lunch, snack, dinner)
- Recipe storage and editing with ingredients and macros
- Ingredient search and CRUD using OpenFoodFacts data
- Daily targets for calories, carbs, protein, fats with progress view

### Tech
- Backend: Python + FastAPI + SQLite, OpenFoodFacts package
- Frontend: Next.js + TypeScript + Tailwind CSS

### Get Started
See `ROADMAP.md` for milestones and `CONVENTIONS.md` for structure and theming.

#### Prerequisites
- Node.js 18+ and npm
- Python 3.10+

#### Install
- Frontend
  - `cd frontend && npm install`
- Backend
  - `cd backend && python -m venv .venv && .venv\\Scripts\\activate && pip install -r requirements.txt`

#### Run
- Frontend: `cd frontend && npm run dev` → `http://localhost:3000`
- Backend: `cd backend && uvicorn app.main:app --reload` → `http://localhost:8000`
  - Health: `http://localhost:8000/health`

### Status
- Backend scaffolded (FastAPI app, CORS, health endpoint, config, DB session)
- Frontend scaffolded (Next.js app, Tailwind v4 theme tokens)
- Lint/format config added (backend: Ruff/Black; frontend: ESLint/Prettier)

### License
MIT
