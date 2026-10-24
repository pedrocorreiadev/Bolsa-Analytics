
import yfinance as yf
import pandas as pd

ATIVOS = {
    "petrobras": "PETR4.SA",
    "vale": "VALE3.SA",
    "ibovespa": "^BVSP",
    "dolar": "BRL=X",
    "ouro": "GC=F",
    "bitcoin": "BTC-USD"
}

PERIODOS = {"5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"}


def obter_historico(ativo: str, periodo: str = "1mo") -> pd.DataFrame:
    """Consulta dados historicos do mercado financeiro."""

    ticker = ATIVOS.get(ativo.lower())

    if ticker is None:
        raise ValueError(f"Ativo nao suportado: {ativo}")

    if periodo not in PERIODOS:
        raise ValueError(f"Periodo nao permitido: {periodo}")

    dados = yf.Ticker(ticker).history(
        period=periodo,
        interval="1d",
        auto_adjust=False
    )

    if dados.empty:
        raise ValueError(f"Sem dados disponiveis para {ativo}")

    return dados
