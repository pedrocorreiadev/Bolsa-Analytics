
import pandas as pd


def preparar_historico(dados: pd.DataFrame) -> list[dict]:
    """
    Limpa e padroniza os dados financeiros
    recebidos do yfinance.

    Retorna uma lista pronta para JSON.
    """

    if dados.empty:
        return []

    colunas = ["Open", "High", "Low", "Close", "Volume"]

    # Verificar se as colunas obrigatorias existem
    obrigatorias = ["Open", "High", "Low", "Close"]

    faltando = [c for c in obrigatorias if c not in dados.columns]

    if faltando:
        raise ValueError(f"Colunas ausentes: {faltando}")

    # Criar copia para nao modificar os dados originais
    df = dados.copy()

    # Tratar volume ausente
    if "Volume" not in df.columns:
        df["Volume"] = float("nan")

    # Converter valores para tipos numericos
    for coluna in colunas:
        df[coluna] = pd.to_numeric(df[coluna], errors="coerce")

    # Remover registros com precos invalidos
    df = df.dropna(subset=obrigatorias)

    # Organizar por data
    df = df.sort_index()

    resultado = []

    for data, linha in df.iterrows():
        registro = {
            "date": pd.Timestamp(data).strftime("%Y-%m-%d"),
            "open": round(float(linha["Open"]), 4),
            "high": round(float(linha["High"]), 4),
            "low": round(float(linha["Low"]), 4),
            "close": round(float(linha["Close"]), 4),
            "volume": (
                int(linha["Volume"])
                if pd.notna(linha["Volume"])
                else None
            )
        }

        resultado.append(registro)

    return resultado
