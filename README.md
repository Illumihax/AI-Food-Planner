# NutriPlan - Macro Tracking & AI-Powered Food Planning

A modern, full-stack application for tracking macros, creating meal plans, and managing recipes with AI assistance.

## Features

- **Macro Tracking**: Log your daily food intake with automatic nutritional calculations
- **Food Database**: Search millions of products via Open Food Facts API
- **Custom Recipes**: Create and save your own recipes with calculated macros
- **Daily Goals**: Set personalized calorie and macro targets
- **AI Meal Planning**: Generate weekly meal plans based on your goals using Google Gemini
- **AI Chat Assistant**: Get nutrition advice and recipe suggestions
- **Multi-language**: Full support for English and German
- **Dark/Light Mode**: Beautiful UI that adapts to your preferences

## Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **SQLite** - Lightweight database with async support (aiosqlite)
- **SQLAlchemy** - Async ORM for database operations
- **Pydantic** - Data validation and settings management
- **Open Food Facts API** - Nutritional data for millions of products
- **Google Gemini AI** - AI-powered meal planning and chat

### Frontend
- **React 18** - UI library
- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **React Query** - Server state management
- **Zustand** - Client state management
- **react-i18next** - Internationalization
- **React Router** - Client-side routing

## Project Structure

```
AI-Food-Planner/
├── backend/
│   ├── app/
│   │   ├── models/      # SQLAlchemy database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── routers/     # API endpoints
│   │   ├── services/    # External service integrations
│   │   ├── config.py    # Settings management
│   │   ├── database.py  # Database configuration
│   │   └── main.py      # FastAPI application
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── stores/      # Zustand stores
│   │   ├── i18n/        # Translations
│   │   ├── lib/         # Utilities and API client
│   │   └── App.tsx      # Root component
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API key (for AI features)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   cp .env.example .env
   ```

5. Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

6. Run the backend server:
   ```bash
   python -m app.main
   ```
   
   Or with uvicorn directly:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## API Documentation

Once the backend is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database URL | `sqlite+aiosqlite:///./nutriplan.db` |
| `GEMINI_API_KEY` | Google Gemini API key | Required for AI features |
| `OFF_USER_AGENT` | Open Food Facts user agent | `NutriPlan/1.0` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `DEBUG` | Enable debug mode | `true` |

## Usage

### Setting Goals
1. Navigate to the Goals page
2. Enter your daily targets for calories, protein, carbs, and fat
3. Save your goals

### Tracking Food
1. Go to the Food Diary
2. Select a meal (Breakfast, Lunch, Dinner, Snack)
3. Search for foods using the Open Food Facts database
4. Adjust portions and add to your diary

### Creating Recipes
1. Navigate to Recipes
2. Click "Create Recipe"
3. Search and add ingredients
4. Set serving size and instructions
5. Save your recipe

### AI Meal Planning
1. Set your daily goals first
2. Go to Meal Planner
3. Configure preferences and dietary restrictions
4. Generate a personalized meal plan

### AI Chat
1. Navigate to AI Assistant
2. Ask questions about nutrition
3. Get personalized advice based on your goals

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- [Open Food Facts](https://openfoodfacts.org/) for their amazing food database API
- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) for beautiful React components
