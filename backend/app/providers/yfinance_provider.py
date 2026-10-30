
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

METADADOS_ATIVOS = {
    "petrobras": {"name": "Petrobras", "category": "Ações", "currency": "BRL", "unit": "currency"},
    "vale": {"name": "Vale", "category": "Ações", "currency": "BRL", "unit": "currency"},
    "ibovespa": {"name": "Ibovespa", "category": "Índices", "currency": "BRL", "unit": "points"},
    "dolar": {"name": "Dólar à vista (USD/BRL)", "category": "Câmbio", "currency": "BRL", "unit": "currency"},
    "ouro": {"name": "Ouro futuro (GC)", "category": "Futuros", "currency": "USD", "unit": "currency"},
    "bitcoin": {"name": "Bitcoin", "category": "Criptoativos", "currency": "USD", "unit": "currency"},
}

INTERVALOS = {"1d", "1wk", "1mo"}


def validar_periodo_intervalo(periodo: str, intervalo: str) -> None:
    """Restringe os controles às combinações de candles oferecidas pela API."""
    if periodo not in PERIODOS:
        raise ValueError(f"Periodo nao permitido: {periodo}")
    if intervalo not in INTERVALOS:
        raise ValueError(f"Intervalo nao permitido: {intervalo}")
    if intervalo == "1wk" and periodo == "5d":
        raise ValueError("Candles semanais exigem um periodo de pelo menos 1 mes.")
    if intervalo == "1mo" and periodo in {"5d", "1mo"}:
        raise ValueError("Candles mensais exigem um periodo de pelo menos 3 meses.")


def obter_historico(ativo: str, periodo: str = "1mo", intervalo: str = "1d") -> pd.DataFrame:
    """Consulta dados historicos do mercado financeiro."""

    ticker = ATIVOS.get(ativo.lower())

    if ticker is None:
        raise ValueError(f"Ativo nao suportado: {ativo}")

    validar_periodo_intervalo(periodo, intervalo)

    dados = yf.Ticker(ticker).history(
        period=periodo,
        interval=intervalo,
        auto_adjust=False,
        timeout=10,
    )

    if dados.empty:
        raise ValueError(f"Sem dados disponiveis para {ativo}")

    return dados
