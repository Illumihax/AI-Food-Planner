from fastapi import FastAPI
from routes.recipes import router as recipes_router

app = FastAPI()

@app.get("/")
def status():
    return "status up"

app.include_router(recipes_router, prefix="/recipes")
