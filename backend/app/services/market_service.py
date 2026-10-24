
from app.providers.yfinance_provider import ATIVOS, obter_historico
from app.processing.market_data import preparar_historico


def listar_ativos():
    """Retorna os ativos financeiros disponiveis."""

    return [
        {
            "id": nome,
            "ticker": ticker
        }
        for nome, ticker in ATIVOS.items()
    ]


def consultar_historico(ativo: str, periodo: str = "1mo"):
    """
    Consulta e processa o historico de um ativo.
    """

    ativo = ativo.lower()

    # Coleta dados com yfinance
    dados = obter_historico(ativo, periodo)

    # Tratamento com Pandas
    historico = preparar_historico(dados)

    # Resposta padronizada para a API
    return {
        "asset": ativo,
        "ticker": ATIVOS[ativo],
        "period": periodo,
        "count": len(historico),
        "data": historico
    }
