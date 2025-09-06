from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    app = FastAPI(title="AI Food Planner API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/")
    def root() -> dict[str, str]:
        return {"message": "AI Food Planner API"}

    return app


app = create_app()

