
import logging

from fastapi import APIRouter, HTTPException, Query

from app.providers.yfinance_provider import ATIVOS, PERIODOS
from app.services.market_service import (
    listar_ativos,
    consultar_historico
)

router = APIRouter(
    prefix="/api/assets",
    tags=["Mercado Financeiro"]
)


@router.get("")
def obter_ativos():
    """Lista todos os ativos disponiveis."""
    return listar_ativos()


@router.get("/{ativo}/history")
def obter_historico_ativo(
    ativo: str,
    period: str = Query(default="1mo")
):
    """Retorna o historico financeiro de um ativo."""

    ativo = ativo.lower()

    if ativo not in ATIVOS:
        raise HTTPException(
            status_code=404,
            detail="Ativo nao encontrado."
        )

    if period not in PERIODOS:
        raise HTTPException(
            status_code=400,
            detail="Periodo nao permitido."
        )

    try:
        return consultar_historico(ativo, period)

    except ValueError as erro:
        raise HTTPException(
            status_code=404,
            detail=str(erro)
        ) from erro

    except Exception as erro:
        logging.exception("Falha na consulta de %s", ativo)
        raise HTTPException(
            status_code=502,
            detail="Falha ao consultar a fonte financeira."
        ) from erro
