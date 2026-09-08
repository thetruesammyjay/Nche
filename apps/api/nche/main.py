from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import events, explain, health, risk

settings = get_settings()
app = FastAPI(title="Nche Risk Intelligence API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router)
app.include_router(events.router)
app.include_router(risk.router)
app.include_router(explain.router)
