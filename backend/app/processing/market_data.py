
import math
from numbers import Number

import pandas as pd


def preparar_historico(dados: pd.DataFrame) -> list[dict]:
    """
    Limpa e padroniza os dados financeiros
    recebidos do yfinance.

    Retorna uma lista pronta para JSON.
    """

    if dados.empty:
        return []

    obrigatorias = ["Open", "High", "Low", "Close"]
    faltando = [c for c in obrigatorias if c not in dados.columns]
    if faltando:
        raise ValueError(f"Colunas ausentes: {faltando}")

    df = dados.copy()
    if "Volume" not in df.columns:
        df["Volume"] = float("nan")

    for coluna in [*obrigatorias, "Volume"]:
        df[coluna] = pd.to_numeric(df[coluna], errors="coerce")

    df = df.dropna(subset=obrigatorias)
    por_data = {}

    for data, linha in df.iterrows():
        # Intervalos diários ou superiores preservam a data da sessão no
        # fuso da fonte. Não desloca para UTC nem cria sessões faltantes.
        if isinstance(data, Number):
            continue
        try:
            instante = pd.Timestamp(data)
        except (TypeError, ValueError, OverflowError):
            continue
        if pd.isna(instante):
            continue

        abertura, maxima, minima, fechamento = (
            float(linha[coluna]) for coluna in obrigatorias
        )
        precos = (abertura, maxima, minima, fechamento)
        if not all(math.isfinite(preco) for preco in precos):
            continue
        if maxima < max(abertura, minima, fechamento) or minima > min(abertura, maxima, fechamento):
            continue

        volume_fonte = float(linha["Volume"]) if pd.notna(linha["Volume"]) else float("nan")
        volume = (
            int(volume_fonte)
            if math.isfinite(volume_fonte) and volume_fonte >= 0
            else None
        )
        dia = instante.strftime("%Y-%m-%d")
        por_data[dia] = {
            "date": dia,
            "open": round(abertura, 4),
            "high": round(maxima, 4),
            "low": round(minima, 4),
            "close": round(fechamento, 4),
            "volume": volume,
        }

    # Em duplicidades usa o último registro válido da fonte; não agrega OHLC.
    return [por_data[dia] for dia in sorted(por_data)]
