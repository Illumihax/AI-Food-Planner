## AI Food Planner — Roadmap

This roadmap translates the idea into a concrete delivery plan with milestones for the backend, frontend, and integration. Each milestone includes clear acceptance criteria and checklists for tracking progress.

### Objectives
- Build a weekly meal planning app with 4 meals/day.
- Save and edit recipes, including ingredients and macros.
- Search and CRUD ingredients, leveraging OpenFoodFacts for nutrition data.
- Track daily macro targets and visualize progress on the weekly plan.
- Future: AI meal plan generation (deferred).

### Architecture Overview
- Backend: Python, FastAPI (suggested), SQLite (file DB), OpenFoodFacts Python package.
- Frontend: Next.js + TypeScript (suggested) with Tailwind CSS.
- API: REST, versioned under `/api/v1` with OpenAPI schema for types.

### Milestones

#### M0 — Project Scaffolding
- [x] Choose framework versions and initialize repos
  - [x] Backend: FastAPI app with base settings and SQLite wiring
  - [x] Frontend: Next.js + TypeScript + Tailwind configured
- [x] Add linting/formatting (Black/Ruff for Python; ESLint/Prettier for TS)
- [x] Add `.env.example` and config loading
- [x] Health endpoints and a starter page

Acceptance criteria:
- [x] Both apps run locally with hot reload
- [ ] CI runs format/lint successfully (optional)

#### M1 — Data Model & Persistence
- Entities (proposed minimal model; can evolve):
  - Ingredient: id, name, brand?, source, macros (per 100g), unit info
  - Recipe: id, name, instructions, tags?, total macros (derived)
  - RecipeIngredient: id, recipe_id, ingredient_id, quantity, unit
  - MealEntry: id, date, mealType (breakfast/lunch/snack/dinner), recipe_id?, customName?, macros
  - UserSettings: daily targets for calories, carbs, protein, fats
- [x] Define SQL models and migrations (or auto-create tables)
- [x] Pydantic schemas (request/response)

Acceptance criteria:
- [ ] CRUD works for Ingredient and Recipe, including nested RecipeIngredients
- [ ] MealEntry persists and reads by date range (week)
- [ ] Settings read/write per user (single-user initially)

#### M2 — Ingredient Service with OpenFoodFacts
- [ ] Add service to query OpenFoodFacts
- [ ] Map external fields to internal Ingredient schema
- [ ] Endpoint to search by name/barcode and import as Ingredient

Acceptance criteria:
- [ ] Searching returns relevant items with macros
- [ ] Importing pre-fills ingredient/macros correctly

#### M3 — Backend API Surface (v1)
- [ ] Endpoints
  - [x] `GET /ingredients`, `POST /ingredients`, `PUT /ingredients/{id}`, `DELETE ...`
  - [ ] `GET /recipes`, `POST /recipes` (with ingredients), `PUT`, `DELETE`
  - [ ] `GET /plan?week=YYYY-Www`, `POST /plan/meal-entries`, `DELETE /plan/meal-entries/{id}`
  - [ ] `GET /settings`, `PUT /settings`
- [ ] Error handling and validation
- [ ] OpenAPI docs exposed at `/docs`

Acceptance criteria:
- [ ] All endpoints manually tested with HTTP client
- [ ] OpenAPI spec generates without errors

#### M4 — Frontend Foundations
- [ ] Pages
  - [ ] Home (overview)
  - [ ] Recipes (list + modal editor)
  - [ ] Ingredients (search + CRUD)
  - [ ] Weekly Plan (calendar grid with 4 meals/day)
  - [ ] Settings (targets)
- [ ] Tailwind base theme (light/dark) with tokens
- [ ] Data fetching with TanStack Query; API client

Acceptance criteria:
- [ ] Navigation works between pages
- [ ] Shared components: Modal, Form, Card, MacroBadge, WeekGrid

#### M5 — Macro Tracking & UX
- [ ] Compute daily totals from MealEntries and render progress vs targets
- [ ] Show overshoot/undershoot indicators per day
- [ ] Drag-and-drop or quick-add recipes to week slots (phase 2 optional)

Acceptance criteria:
- [ ] Weekly plan shows totals and per-meal macros
- [ ] Clear visual state for target adherence

#### M6 — Quality & Polish
- [ ] Unit tests: services, API routes
- [ ] E2E smoke tests (optional)
- [ ] Error states, loading skeletons, empty states

### Integration Plan
- Contract-first: rely on OpenAPI JSON to generate TypeScript types (e.g., `openapi-typescript`)
- Versioning: `/api/v1` routes; non-breaking changes preferred
- Error model: consistent `{ error: { code, message } }`
- Auth: deferred; single-user local app initially

### Definition of Done (per feature)
- Functionality works and is covered by basic tests
- UI states covered: loading, error, empty
- Accessible components (labels, roles, color contrast)
- Types validated end-to-end (backend schema ⇄ frontend types)

### Risks & Decisions
- Framework choices (FastAPI/Next.js) are suggestions aligned with goals
- Nutrition data variability in OpenFoodFacts → allow manual edits
- Single-user assumptions may need refactoring for multi-user later

### Tracking
Use the checklists above. Optionally add project boards with the milestone labels M0–M6.


