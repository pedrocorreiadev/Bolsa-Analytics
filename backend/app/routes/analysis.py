import logging
from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.cache.market_cache import consultar_com_cache
from app.processing.tendencias import analisar_tendencia, correlacionar_retornos
from app.providers.yfinance_provider import ATIVOS, validar_periodo_intervalo
from app.services.market_service import consultar_historico

router = APIRouter(prefix="/api/analysis", tags=["Análise de tendência"])


def carregar(ativo, periodo):
    return consultar_com_cache(ativo, periodo, "1d", consultar_historico)


@router.get("/{ativo}")
def analisar(ativo: str, period: str = "3mo", short: int = Query(5, ge=2, le=199),
             long: int = Query(20, ge=3, le=200), horizon: int = Query(10, ge=1, le=20),
             start: date | None = None, end: date | None = None, benchmark: str | None = None):
    ativo = ativo.lower()
    if ativo not in ATIVOS or (benchmark is not None and benchmark not in ATIVOS):
        raise HTTPException(404, "Ativo não encontrado.")
    if short >= long or (start and end and start > end):
        raise HTTPException(400, "A janela curta deve ser menor que a longa e a data inicial não pode superar a final.")
    try:
        validar_periodo_intervalo(period, "1d")
    except ValueError as erro:
        raise HTTPException(400, str(erro)) from erro
    try:
        historico = carregar(ativo, period)
    except ValueError as erro:
        raise HTTPException(404, str(erro)) from erro
    except Exception as erro:
        logging.exception("Falha na coleta da análise de %s", ativo)
        raise HTTPException(502, "Falha ao consultar a fonte financeira.") from erro

    def filtrar(pontos):
        return [ponto for ponto in pontos if (not start or ponto["date"] >= start.isoformat()) and (not end or ponto["date"] <= end.isoformat())]

    pontos = filtrar(historico["data"])
    try:
        analise = analisar_tendencia(pontos, short, long, horizon)
    except ValueError as erro:
        raise HTTPException(422, str(erro)) from erro
    correlacao = None
    if benchmark:
        try:
            referencia = historico if benchmark == ativo else carregar(benchmark, period)
            correlacao = {"ativo": benchmark, **correlacionar_retornos(pontos, filtrar(referencia["data"]))}
        except Exception:
            logging.warning("Referência de correlação indisponível: %s", benchmark)
            correlacao = {"ativo": benchmark, "valor": None, "pares": 0, "motivo": "A fonte de referência está indisponível. Tente atualizar a análise."}
    return {**analise, "ativo": ativo, "ticker": historico["ticker"], "moeda": historico["currency"], "unidade": historico["unit"],
            "fonte": historico["source"], "coletado_em": historico.get("collected_at"), "tempo_real": False,
            "qualidade": historico.get("quality"), "em_cache": historico.get("cached", False), "correlacao": correlacao}
