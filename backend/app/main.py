"""Inicialização da API e configuração de desenvolvimento local."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.market import router as market_router
from app.routes.auth import router as auth_router
from app.routes.analysis import router as analysis_router
from app.routes.admin import router as admin_router
from app.routes.quotes import router as quotes_router

app = FastAPI(title="Bolsa Analytics", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT"],
    allow_headers=["Content-Type", "X-Bolsa-Client"],
)

app.include_router(health_router)
app.include_router(market_router)
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(admin_router)
app.include_router(quotes_router)
