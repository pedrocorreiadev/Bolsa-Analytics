"""Cotação intradiária: identifica o candle de um minuto, sem prometer tick em tempo real."""

import math
from datetime import datetime, timezone
from numbers import Number

import pandas as pd
import yfinance as yf

from app.providers.yfinance_provider import ATIVOS, METADADOS_ATIVOS


def consultar_cotacao(ativo, _periodo="1d", _intervalo="1m"):
    dados = yf.Ticker(ATIVOS[ativo]).history(period="1d", interval="1m", auto_adjust=False, timeout=10, raise_errors=True)
    if dados.empty:
        raise ValueError("Sem cotação intradiária disponível para este ativo.")
    if not all(coluna in dados.columns for coluna in ["Open", "High", "Low", "Close"]):
        raise ValueError("Cotação intradiária sem os campos necessários.")
    fuso = getattr(dados.index, "tz", None)
    if fuso is None:
        raise ValueError("A fonte intradiária não informou o fuso dos registros.")
    pontos = {}
    for instante, linha in dados.iterrows():
        if isinstance(instante, Number):
            continue
        try:
            data = pd.Timestamp(instante)
            precos = [float(linha[coluna]) for coluna in ["Open", "High", "Low", "Close"]]
        except (ValueError, TypeError, OverflowError):
            continue
        if pd.isna(data) or not all(math.isfinite(p) and p > 0 for p in precos):
            continue
        abertura, maxima, minima, fechamento = precos
        if maxima < max(precos) or minima > min(precos):
            continue
        pontos[data.isoformat()] = {"time": data.isoformat(), "open": abertura, "high": maxima, "low": minima, "close": fechamento}
    serie = [pontos[chave] for chave in sorted(pontos)]
    if not serie:
        raise ValueError("A fonte não devolveu cotações intradiárias válidas.")
    return {"asset": ativo, "ticker": ATIVOS[ativo], **METADADOS_ATIVOS[ativo], "timezone": str(fuso),
            "source": "Yahoo Finance / yfinance", "realtime": False, "interval": "1m",
            "collected_at": datetime.now(timezone.utc).isoformat(), "as_of": serie[-1]["time"],
            "count": len(serie), "data": serie,
            "quality": {"received": len(dados), "valid": len(serie), "discarded": len(dados) - len(serie)}}
