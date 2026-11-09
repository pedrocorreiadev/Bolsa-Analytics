"""Algoritmo explicável em português: descreve a amostra, sem sinal de compra/venda.

Não inventa pregões, não preenche preços ausentes e não remove movimentos extremos.
A projeção usa o índice das observações, não datas de negociação futuras.
"""

import math
from statistics import mean, median, stdev


def media_movel(fechamentos: list[float], janela: int, indice: int):
    if indice + 1 < janela:
        return None
    return mean(fechamentos[indice + 1 - janela:indice + 1])


def correlacionar_retornos(primeiro: list[dict], segundo: list[dict]) -> dict:
    def retornos_por_data(serie):
        return {atual["date"]: (anterior["date"], atual["close"] / anterior["close"] - 1)
                for anterior, atual in zip(serie, serie[1:]) if anterior["close"] > 0 and atual["close"] > 0}

    retornos_a, retornos_b = retornos_por_data(primeiro), retornos_por_data(segundo)
    # Compara somente retornos com o mesmo início E fim. Um feriado em uma
    # bolsa não pode virar correlação entre um dia e vários dias em outra.
    pares = [(retornos_a[dia][1], retornos_b[dia][1]) for dia in sorted(retornos_a.keys() & retornos_b.keys())
             if retornos_a[dia][0] == retornos_b[dia][0]]
    if len(pares) < 3:
        return {"valor": None, "pares": len(pares), "motivo": "São necessários três retornos com as mesmas datas de início e fim."}
    valores_a, valores_b = zip(*pares)
    media_a, media_b = mean(valores_a), mean(valores_b)
    denominador = math.sqrt(sum((x - media_a) ** 2 for x in valores_a) * sum((y - media_b) ** 2 for y in valores_b))
    valor = sum((x - media_a) * (y - media_b) for x, y in pares) / denominador if denominador > 0 else None
    return {"valor": max(-1, min(1, valor)) if valor is not None else None, "pares": len(pares),
            "motivo": None if valor is not None else "Uma das séries não apresenta variação nos retornos."}


def analisar_tendencia(historico: list[dict], janela_curta=5, janela_longa=20, horizonte=10) -> dict:
    """Cruza médias móveis e inclinação; R² mede ajuste passado, não certeza futura."""
    if not 2 <= janela_curta < janela_longa <= 200 or not 1 <= horizonte <= 20:
        raise ValueError("Janelas ou horizonte inválidos.")
    if len(historico) < max(janela_longa, 10):
        raise ValueError(f"A amostra precisa de pelo menos {max(janela_longa, 10)} observações válidas. Amplie o período ou reduza a janela longa.")
    fechamentos = [ponto["close"] for ponto in historico]
    if any(not math.isfinite(valor) or valor <= 0 for valor in fechamentos):
        raise ValueError("A análise exige fechamentos positivos e finitos.")

    quantidade = len(fechamentos)
    # O logaritmo mantém as projeções positivas e expressa crescimento relativo.
    log_precos = [math.log(preco) for preco in fechamentos]
    centro_x = (quantidade - 1) / 2
    centro_y = mean(log_precos)
    soma_quadrados_x = sum((indice - centro_x) ** 2 for indice in range(quantidade))
    inclinacao = sum((indice - centro_x) * (valor - centro_y) for indice, valor in enumerate(log_precos)) / soma_quadrados_x
    intercepto = centro_y - inclinacao * centro_x
    ajustes = [intercepto + inclinacao * indice for indice in range(quantidade)]
    soma_residuos = sum((real - ajuste) ** 2 for real, ajuste in zip(log_precos, ajustes))
    variacao_total = sum((valor - centro_y) ** 2 for valor in log_precos)
    r_quadrado = max(0, min(1, 1 - soma_residuos / variacao_total)) if variacao_total > 1e-20 else 0
    desvio_residual = math.sqrt(soma_residuos / (quantidade - 2))

    retornos = [(atual / anterior - 1) * 100 for anterior, atual in zip(fechamentos, fechamentos[1:])]
    retorno_medio = mean(retornos)
    volatilidade = stdev(retornos)
    curta = media_movel(fechamentos, janela_curta, quantidade - 1)
    longa = media_movel(fechamentos, janela_longa, quantidade - 1)
    diferenca_medias = (curta / longa - 1) * 100
    crescimento = math.expm1(inclinacao) * 100
    # Limiares explícitos da heurística, não probabilidades de valorização.
    direcao = "lateral"
    if r_quadrado >= 0.2 and crescimento > 0.01 and diferenca_medias > 0.1:
        direcao = "alta"
    elif r_quadrado >= 0.2 and crescimento < -0.01 and diferenca_medias < -0.1:
        direcao = "baixa"
    elif abs(diferenca_medias) > 0.1 and abs(crescimento) > 0.01:
        direcao = "mista"

    pico, queda_maxima = fechamentos[0], 0
    for preco in fechamentos:
        pico = max(pico, preco)
        queda_maxima = min(queda_maxima, (preco / pico - 1) * 100)

    serie = [{"data": ponto["date"], "fechamento": ponto["close"],
              "media_curta": media_movel(fechamentos, janela_curta, indice),
              "media_longa": media_movel(fechamentos, janela_longa, indice),
              "ajuste": math.exp(ajustes[indice])} for indice, ponto in enumerate(historico)]

    projecoes = []
    for passo in range(1, horizonte + 1):
        indice_futuro = quantidade - 1 + passo
        centro = intercepto + inclinacao * indice_futuro
        dispersao = 2 * desvio_residual * math.sqrt(1 + 1 / quantidade + (indice_futuro - centro_x) ** 2 / soma_quadrados_x)
        projecoes.append({"passo": passo, "estimativa": math.exp(centro),
                          "inferior": math.exp(centro - dispersao), "superior": math.exp(centro + dispersao)})

    return {
        "direcao": direcao, "observacoes": quantidade, "inicio": historico[0]["date"], "fim": historico[-1]["date"],
        "janela_curta": janela_curta, "janela_longa": janela_longa, "horizonte": horizonte,
        "estatisticas": {"media": mean(fechamentos), "mediana": median(fechamentos), "minimo": min(fechamentos),
                         "maximo": max(fechamentos), "variacao_pct": (fechamentos[-1] / fechamentos[0] - 1) * 100,
                         "retorno_medio_pct": retorno_medio, "volatilidade_pct": volatilidade,
                         "queda_maxima_pct": queda_maxima, "r_quadrado": r_quadrado,
                         "inclinacao_pct": crescimento, "distancia_medias_pct": diferenca_medias,
                         "movimentos_extremos": sum(abs(retorno - retorno_medio) > 3 * volatilidade for retorno in retornos) if volatilidade else 0},
        "serie": serie, "projecoes": projecoes,
        "explicacao": [
            f"Foram usadas {quantidade} observações diárias válidas, em ordem e sem preencher datas ausentes.",
            f"As médias de {janela_curta} e {janela_longa} observações descrevem o movimento recente.",
            "A regressão linear do logaritmo dos fechamentos descreve o ritmo da amostra completa; R² indica ajuste histórico.",
            "Alta/baixa exige R² ≥ 0,20, inclinação diária além de ±0,01% e distância entre médias além de ±0,10%, na mesma direção. Divergências são mistas; demais casos são laterais.",
            "A faixa ilustrativa usa duas vezes o desvio residual no espaço logarítmico, incluindo a distância de extrapolação. Não tem cobertura probabilística validada para mercados financeiros.",
        ],
        "avisos": [
            "Estudo acadêmico: cenários não são garantia de desempenho nem recomendação de investimento.",
            "Preços não ajustados podem refletir dividendos e desdobramentos. Movimentos extremos são mantidos na amostra.",
            "Passos futuros representam observações, sem previsão de datas ou de feriados. A regressão pode divergir do último fechamento.",
        ],
    }
