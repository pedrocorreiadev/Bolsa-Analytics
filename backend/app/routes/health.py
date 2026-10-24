"""Verificação básica de funcionamento da API."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Resposta do endpoint de saúde."""

    status: Literal["ok"] = "ok"


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Confirma que a API está em execução."""
    return HealthResponse()
