from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import create_tables
from app.api import recipes, meal_plans, ingredients

# Create FastAPI app
app = FastAPI(
    title="AI Food Planner API",
    description="A comprehensive meal planning API with nutrition tracking",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Include API routers
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(meal_plans.router, prefix="/api/meal-plans", tags=["meal-plans"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["ingredients"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "AI Food Planner API", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"} 