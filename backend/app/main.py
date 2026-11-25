import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import config
from .database import Base, engine
from .routers import admin, ai, hazards, routing

Base.metadata.create_all(bind=engine)
os.makedirs(config.UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Suraksha AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR), name="uploads")
app.include_router(hazards.router)
app.include_router(admin.router)
app.include_router(routing.router)
app.include_router(ai.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "database": "postgresql" if not config.DATABASE_URL.startswith("sqlite") else "sqlite",
        "routing_configured": bool(config.GOOGLE_ROUTES_API_KEY),
        "admin_enabled": bool(config.ADMIN_TOKEN),
        "ai_model_connected": bool(config.GEMINI_API_KEY),
        "ai_provider": "Google Gemini" if config.GEMINI_API_KEY else None,
    }
