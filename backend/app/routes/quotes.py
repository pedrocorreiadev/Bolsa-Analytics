import logging

from fastapi import APIRouter, HTTPException

from app.cache.market_cache import consultar_com_cache
from app.providers.yfinance_provider import ATIVOS
from app.services.quote_service import consultar_cotacao

router = APIRouter(prefix="/api/quotes", tags=["Cotações intradiárias"])


@router.get("/{ativo}")
def cotacao(ativo: str):
    ativo = ativo.lower()
    if ativo not in ATIVOS:
        raise HTTPException(404, "Ativo não encontrado.")
    try:
        return consultar_com_cache(ativo, "1d", "1m", consultar_cotacao)
    except ValueError as erro:
        raise HTTPException(404, str(erro)) from erro
    except Exception as erro:
        logging.exception("Falha na cotação intradiária de %s", ativo)
        raise HTTPException(502, "Não foi possível consultar a cotação intradiária.") from erro
