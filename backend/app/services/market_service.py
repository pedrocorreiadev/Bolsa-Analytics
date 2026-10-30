
from app.providers.yfinance_provider import ATIVOS, METADADOS_ATIVOS, obter_historico
from app.processing.market_data import preparar_historico


def listar_ativos():
    """Retorna os ativos financeiros disponiveis."""

    return [
        {
            "id": nome,
            "ticker": ticker,
            **METADADOS_ATIVOS[nome],
            "timezone": None,
        }
        for nome, ticker in ATIVOS.items()
    ]


def consultar_historico(ativo: str, periodo: str = "1mo", intervalo: str = "1d"):
    """
    Consulta e processa o historico de um ativo.
    """

    ativo = ativo.lower()

    # Coleta dados com yfinance
    dados = obter_historico(ativo, periodo, intervalo)

    # Tratamento com Pandas
    historico = preparar_historico(dados)
    if not historico:
        raise ValueError("Nenhum candle OHLC valido disponivel para este ativo e periodo.")

    fuso = getattr(dados.index, "tz", None)
    metadados = METADADOS_ATIVOS[ativo]

    # Resposta padronizada para a API
    return {
        "asset": ativo,
        "ticker": ATIVOS[ativo],
        "period": periodo,
        "interval": intervalo,
        "currency": metadados["currency"],
        "unit": metadados["unit"],
        "timezone": str(fuso) if fuso is not None else None,
        "source": "Yahoo Finance / yfinance",
        "count": len(historico),
        "data": historico
    }
