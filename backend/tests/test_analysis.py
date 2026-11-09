import math
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from unittest.mock import patch

import pandas as pd

from app.cache.market_cache import consultar_com_cache, limpar_cache, resumo_coleta
from app.processing.tendencias import analisar_tendencia, correlacionar_retornos
from app.services.quote_service import consultar_cotacao
from test_accounts import requisitar


def serie(quantidade=60, ritmo=0.01):
    return [{"date": (date(2026, 1, 1) + timedelta(days=i)).isoformat(), "close": 100 * math.exp(ritmo * i)} for i in range(quantidade)]


def resposta(pontos):
    return {"data": pontos, "ticker": "PETR4.SA", "currency": "BRL", "unit": "currency", "source": "Teste", "count": len(pontos)}


class TendenciaTests(unittest.TestCase):
    def setUp(self):
        limpar_cache()

    def test_tendencias_conhecidas_e_retorno_com_desvio_amostral(self):
        for ritmo, direcao in [(0.01, "alta"), (-0.01, "baixa"), (0, "lateral")]:
            resultado = analisar_tendencia(serie(ritmo=ritmo))
            self.assertEqual(resultado["direcao"], direcao)
            self.assertAlmostEqual(resultado["estatisticas"]["variacao_pct"], math.expm1(ritmo * 59) * 100)
            self.assertAlmostEqual(resultado["estatisticas"]["volatilidade_pct"], 0)
            self.assertEqual(len(resultado["projecoes"]), 10)
            self.assertIsNone(resultado["serie"][3]["media_curta"])
            self.assertIsNotNone(resultado["serie"][4]["media_curta"])
            self.assertAlmostEqual(resultado["projecoes"][-1]["estimativa"], 100 * math.exp(ritmo * 69))

    def test_amostra_insuficiente_precos_invalidos_e_janelas(self):
        for pontos in [[], serie(5), [{**p, "close": 0} for p in serie()], [{**p, "close": float("inf")} for p in serie()]]:
            with self.assertRaises(ValueError):
                analisar_tendencia(pontos)
        with self.assertRaises(ValueError):
            analisar_tendencia(serie(), 20, 5)

    def test_projecao_tem_faixa_positiva_que_amplia_com_distancia(self):
        pontos = serie()
        for i, ponto in enumerate(pontos):
            ponto["close"] *= 1 + 0.04 * math.sin(i)
        resultado = analisar_tendencia(pontos, horizonte=20)
        for p in resultado["projecoes"]:
            self.assertLess(p["inferior"], p["estimativa"])
            self.assertLess(p["estimativa"], p["superior"])
            self.assertGreater(p["inferior"], 0)
        primeiro, ultimo = resultado["projecoes"][0], resultado["projecoes"][-1]
        self.assertGreater(ultimo["superior"] / ultimo["inferior"], primeiro["superior"] / primeiro["inferior"])

    def test_correlacao_alinha_inicio_e_fim_e_trata_constantes(self):
        pontos = serie()
        for i, ponto in enumerate(pontos):
            ponto["close"] *= 1 + 0.02 * math.sin(i)
        self.assertAlmostEqual(correlacionar_retornos(pontos, pontos)["valor"], 1)
        self.assertIsNone(correlacionar_retornos(serie(4, 0), serie(4, 0))["valor"])
        incompleta = [p for i, p in enumerate(pontos) if i != 2]
        self.assertEqual(correlacionar_retornos(pontos, incompleta)["pares"], 57)
        self.assertIsNone(correlacionar_retornos(pontos[:2], pontos[:2])["valor"])

    @patch("app.routes.analysis.consultar_historico")
    def test_filtros_na_api_recalculam_somente_amostra_e_validam_entradas(self, fonte):
        pontos = serie()
        fonte.return_value = resposta(pontos)
        status, analise, _ = requisitar("/api/analysis/petrobras?start=2026-01-21&end=2026-02-15&short=3&long=10&horizon=5")
        self.assertEqual(status, 200, analise)
        self.assertEqual(analise["observacoes"], 26)
        self.assertEqual(analise["inicio"], "2026-01-21")
        self.assertAlmostEqual(analise["estatisticas"]["media"], sum(p["close"] for p in pontos[20:46]) / 26)
        for consulta in ["short=20&long=5", "start=2026-02-20&end=2026-01-01", "period=bad"]:
            self.assertEqual(requisitar(f"/api/analysis/petrobras?{consulta}")[0], 400)
        self.assertEqual(requisitar("/api/analysis/petrobras?start=2026-02-28")[0], 422)
        self.assertEqual(requisitar("/api/analysis/invalido")[0], 404)

    @patch("app.routes.analysis.consultar_historico")
    def test_falha_na_referencia_preserva_analise_e_falha_na_fonte_e_502(self, fonte):
        fonte.side_effect = [resposta(serie()), RuntimeError("offline")]
        with self.assertLogs(level="WARNING"):
            status, analise, _ = requisitar("/api/analysis/petrobras?benchmark=ibovespa")
        self.assertEqual(status, 200)
        self.assertIsNone(analise["correlacao"]["valor"])
        limpar_cache()
        fonte.side_effect = RuntimeError("offline")
        with self.assertLogs(level="ERROR"):
            self.assertEqual(requisitar("/api/analysis/petrobras")[0], 502)


class ColetaTests(unittest.TestCase):
    def setUp(self):
        limpar_cache()

    def test_cache_deduplica_requisicoes_concorrentes_e_isola_mutacoes(self):
        chamadas = []
        trava = threading.Lock()

        def carregar(*_):
            with trava:
                chamadas.append(1)
            time.sleep(0.02)
            return resposta(serie())

        with ThreadPoolExecutor(max_workers=6) as executor:
            resultados = list(executor.map(lambda _: consultar_com_cache("petrobras", "3mo", "1d", carregar), range(6)))
        self.assertEqual(len(chamadas), 1)
        resultados[0]["data"][0]["close"] = 0
        self.assertEqual(consultar_com_cache("petrobras", "3mo", "1d", carregar)["data"][0]["close"], 100)
        limpar_cache()
        consultar_com_cache("petrobras", "3mo", "1d", carregar)
        self.assertEqual(len(chamadas), 2)

    def test_falha_nao_e_armazenada_e_aparece_no_monitor(self):
        def falhar(*_):
            raise ValueError("offline")
        antes = resumo_coleta()["falhas"]
        for _ in range(2):
            with self.assertRaises(ValueError):
                consultar_com_cache("vale", "1mo", "1d", falhar)
        self.assertEqual(resumo_coleta()["falhas"], antes + 2)

    @patch("app.services.quote_service.yf.Ticker")
    def test_cotacao_preserva_timestamps_intradiarios_fuso_e_qualidade(self, ticker):
        dados = pd.DataFrame({"Open": [10, 12, 0], "High": [12, 14, 2], "Low": [9, 11, 0], "Close": [11, 13, 1]},
                             index=pd.DatetimeIndex(["2026-01-01 10:01", "2026-01-01 10:02", "2026-01-01 10:03"], tz="America/Sao_Paulo"))
        ticker.return_value.history.return_value = dados
        cotacao = consultar_cotacao("petrobras")
        self.assertEqual(cotacao["count"], 2)
        self.assertEqual(cotacao["quality"]["discarded"], 1)
        self.assertEqual(cotacao["as_of"], "2026-01-01T10:02:00-03:00")
        self.assertFalse(cotacao["realtime"])
        ticker.return_value.history.assert_called_once_with(period="1d", interval="1m", auto_adjust=False, timeout=10, raise_errors=True)
