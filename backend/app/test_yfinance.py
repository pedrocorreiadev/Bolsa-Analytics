
import yfinance as yf

# Ativos financeiros que vamos consultar
ativos = {
    "Petrobras": "PETR4.SA",
    "Vale": "VALE3.SA",
    "Ibovespa": "^BVSP",
    "Dolar Comercial": "BRL=X",
    "Ouro": "GC=F",
    "Bitcoin": "BTC-USD"
}

def consultar_ativos():
    print("\n===== BOLSA ANALYTICS =====")
    print("Iniciando coleta de dados financeiros...\n")

    for nome, ticker in ativos.items():
        print(f"\nConsultando: {nome} ({ticker})")

        try:
            dados = yf.Ticker(ticker).history(
    period="1mo",
    interval="1d",
    auto_adjust=False
)

            if dados.empty:
                print("Nenhum dado encontrado.")
                continue

            colunas = ["Open", "High", "Low", "Close", "Volume"]
            dados = dados[colunas].dropna(subset=["Close"])

            print(f"Registros encontrados: {len(dados)}")
            print(dados.tail(3).round(2).to_string())

            ultimo = dados.iloc[-1]
            data = dados.index[-1].strftime("%d/%m/%Y")

            print(f"Ultima data: {data}")
            print(f"Ultimo fechamento: {ultimo['Close']:.2f}")
            print("Status: SUCESSO")

        except Exception as erro:
            print(f"Erro ao consultar {nome}: {erro}")

    print("\n===== TESTE FINALIZADO =====")

if __name__ == "__main__":
    consultar_ativos()
