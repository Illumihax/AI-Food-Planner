# AI Food Planner

A comprehensive meal planning application that helps you plan meals and weekly menus using custom recipes or AI-generated recipes. Track macros, calories, and customize portions to meet your nutritional goals.

## 🎯 Features

### Core Features
- **Meal Planning**: Plan individual meals and complete weekly menus
- **Recipe Management**: Create, edit, and organize your custom recipes
- **AI Recipe Generation**: Generate recipes using Gemini AI based on preferences and dietary requirements
- **Nutrition Tracking**: View detailed macros (protein, carbs, fats) and calories for meals and weekly plans
- **Portion Control**: Adjust serving sizes and portions to customize nutritional values
- **Weekly Overview**: Visual calendar view for meal planning across the week

### Advanced Features
- **Grocery List Generation**: Auto-generate shopping lists from meal plans
- **Dietary Preferences**: Support for various diets (vegan, keto, Mediterranean, etc.)
- **Nutritional Goals**: Set and track daily/weekly macro and calorie targets
- **Recipe Scaling**: Automatically adjust ingredients based on serving size
- **Meal History**: Track previously planned meals and favorites

## 🛠️ Technology Stack

### Backend (FastAPI)
- **Framework**: FastAPI (Python)
- **Database**: SQLite3 with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **AI Integration**: Google Gemini API for recipe generation
- **Nutrition API**: Integration with nutrition databases (e.g., USDA Food Data Central)
- **Testing**: pytest
- **Documentation**: Auto-generated with FastAPI/OpenAPI

### Frontend (Next.js)
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: Zustand or React Query
- **UI Components**: shadcn/ui or Chakra UI
- **Calendar**: React Big Calendar for meal planning view
- **Charts**: Chart.js or Recharts for nutrition visualization
- **Testing**: Jest + React Testing Library

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger/OpenAPI
- **Environment Management**: Python venv, Node.js npm/yarn
- **Code Quality**: ESLint, Prettier, Black (Python)

## 📁 Project Structure

```
AI-Food-Planner/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── db/             # Database models & connection
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app entry point
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile
│   └── pytest.ini
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
├── docker-compose.yml      # Development environment
├── .env.example           # Environment variables template
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key

### Backend Setup (FastAPI)

```bash
# Navigate to project root
cd AI-Food-Planner

# Create and navigate to backend directory
mkdir backend
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install FastAPI and dependencies
pip install fastapi uvicorn sqlalchemy python-multipart python-jose passlib bcrypt google-generativeai python-dotenv alembic pytest

# Create requirements.txt
pip freeze > requirements.txt

# Create basic FastAPI structure
mkdir app
mkdir app/api app/core app/db app/services

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup (Next.js)

```bash
# Navigate to project root (open new terminal)
cd AI-Food-Planner

# Create Next.js application
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --use-npm

# Navigate to frontend directory
cd frontend

# Install additional dependencies
npm install @tanstack/react-query zustand lucide-react date-fns react-big-calendar chart.js react-chartjs-2

# Install UI component library (choose one)
# Option 1: shadcn/ui
npx shadcn-ui@latest init
# Option 2: Chakra UI
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion

# Start development server
npm run dev
```

### Database Setup

```bash
# SQLite database will be automatically created in backend folder
# No additional setup required - the database file will be created when you first run the backend
# Database file location: backend/ai_food_planner.db
```

### Environment Variables

Create `.env` file in project root:

```env
# Backend
DATABASE_URL=sqlite:///./backend/ai_food_planner.db
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
NUTRITION_API_KEY=your-nutrition-api-key (optional)

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Full Development Environment (Docker)

```bash
# Create docker-compose.yml and run all services
docker-compose up --build

# Backend will be available at: http://localhost:8000
# Frontend will be available at: http://localhost:3000
# Database file will be created at: backend/ai_food_planner.db
```

## 📋 Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up project structure and development environment
- [ ] Implement basic user authentication (register/login)
- [ ] Create database models (User, Recipe, Meal, MealPlan)
- [ ] Build basic CRUD operations for recipes
- [ ] Create simple frontend layout and navigation

### Phase 2: Core Features (Weeks 3-4)
- [ ] Implement recipe creation and editing interface
- [ ] Add nutrition calculation system
- [ ] Build meal planning calendar view
- [ ] Integrate Gemini AI for recipe generation
- [ ] Add portion adjustment functionality

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Implement weekly meal planning
- [ ] Add grocery list generation
- [ ] Create nutrition tracking dashboard
- [ ] Implement dietary preference filters
- [ ] Add meal history and favorites

### Phase 4: Polish & Deploy (Weeks 7-8)
- [ ] Add comprehensive testing
- [ ] Optimize performance
- [ ] Implement responsive design
- [ ] Deploy to production
- [ ] Create user documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
