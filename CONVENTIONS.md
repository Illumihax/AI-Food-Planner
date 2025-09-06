## AI Food Planner — Conventions & Structure

These conventions aim for clarity, consistency, and ease of onboarding. Adjust as the codebase evolves, but keep changes documented here.

### Repository Layout
- `backend/` — FastAPI app, SQLite DB, OpenFoodFacts integration
- `frontend/` — Next.js + TypeScript + Tailwind app
- `infra/` — Scripts, docker, CI configs (optional later)
- `docs/` — Additional documentation, diagrams

### Backend Conventions (Python/FastAPI)
- Structure
  - `app/main.py` — app bootstrap
  - `app/api/v1/` — routers per domain: `ingredients.py`, `recipes.py`, `plan.py`, `settings.py`
  - `app/models/` — SQLModel/SQLAlchemy models
  - `app/schemas/` — Pydantic request/response models
  - `app/services/` — business logic, OpenFoodFacts client
  - `app/db.py` — session, engine
  - `app/config.py` — settings via `pydantic-settings`
- Style
  - Format with Black, lint with Ruff; type-check with mypy (gradual)
  - Use explicit response models; raise `HTTPException` with consistent error shape
  - Prefer dependency-injected sessions per request

### Frontend Conventions (Next.js + TypeScript)
- Structure
  - `app/` routing (or `src/app/`)
    - `(routes)/ingredients`, `(routes)/recipes`, `(routes)/plan`, `(routes)/settings`
  - `components/` — shared UI
  - `features/` — domain-specific logic (hooks, components)
  - `lib/api/` — API client, fetch wrappers
  - `lib/types/` — types (generated from OpenAPI where possible)
  - `styles/` — globals, Tailwind config extensions
- Style
  - Use TypeScript strict mode
  - Data fetching with TanStack Query; never fetch inside deeply nested components unless necessary
  - Forms with React Hook Form + Zod schemas

### Tailwind CSS Theme Conventions
- Use CSS variables for semantic tokens and support light/dark themes.
- Centralize theme in `tailwind.config.ts` and global CSS.

Base variables (global CSS):
```css
:root {
  --color-bg: 255 255 255;
  --color-fg: 17 24 39;
  --color-primary: 59 130 246; /* blue-500 */
  --color-primary-foreground: 255 255 255;
  --color-muted: 243 244 246; /* gray-100 */
  --color-card: 255 255 255;
}
.dark {
  --color-bg: 17 24 39; /* gray-900 */
  --color-fg: 229 231 235; /* gray-200 */
  --color-primary: 96 165 250; /* blue-400 */
  --color-primary-foreground: 0 0 0;
  --color-muted: 31 41 55; /* gray-800 */
  --color-card: 31 41 55;
}
```

Tailwind config (example tokens):
```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primaryForeground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
export default config;
```

Usage examples:
```tsx
// Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-primary text-primaryForeground rounded px-3 py-2 hover:opacity-90">
      {children}
    </button>
  );
}
```

Global CSS setup (`app/globals.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html { background-color: rgb(var(--color-bg)); color: rgb(var(--color-fg)); }
```

Theme toggling:
- Add/remove `dark` class on `html` via a simple theme hook.
- Persist preference in `localStorage`.

### API Conventions
- Base URL: `/api/v1`
- Use nouns for resources; plurals for collections
- Consistent error envelope: `{ error: { code, message } }`
- Use OpenAPI to generate frontend types

### Git & Workflow
- Conventional Commits (`feat:`, `fix:`, `docs:` ...)
- PR checklist: tests pass, types ok, UI states covered
- Keep README/ROADMAP/CONVENTIONS up-to-date on changes


