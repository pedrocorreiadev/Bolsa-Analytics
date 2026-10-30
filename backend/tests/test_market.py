"""Contrato e higienização de OHLCV sem chamadas à fonte financeira."""

import asyncio
import json
import unittest
from unittest.mock import patch

import pandas as pd

from app.main import app
from app.processing.market_data import preparar_historico
from app.providers.yfinance_provider import obter_historico, validar_periodo_intervalo
from app.services.market_service import consultar_historico, listar_ativos


def quadro(linhas, datas=None):
    return pd.DataFrame(
        linhas,
        columns=["Open", "High", "Low", "Close", "Volume"],
        index=datas if datas is not None else pd.DatetimeIndex(["2026-10-28"], tz="America/Sao_Paulo"),
    )


def solicitar(caminho, consulta=""):
    """Exercita a aplicação ASGI com HTTP em memória, sem cliente adicional."""
    async def executar():
        mensagens = []

        async def receber():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def enviar(mensagem):
            mensagens.append(mensagem)

        await app(
            {
                "type": "http", "asgi": {"version": "3.0"},
                "method": "GET", "path": caminho, "raw_path": caminho.encode(),
                "query_string": consulta.encode(), "headers": [],
                "scheme": "http", "server": ("test", 80), "client": ("test", 1), "root_path": "",
            },
            receber,
            enviar,
        )
        status = next(item["status"] for item in mensagens if item["type"] == "http.response.start")
        corpo = b"".join(item.get("body", b"") for item in mensagens if item["type"] == "http.response.body")
        return status, json.loads(corpo)

    return asyncio.run(executar())


class ProcessamentoTests(unittest.TestCase):
    def test_ordena_deduplica_e_preserva_data_local_sem_preencher_lacunas(self):
        dados = quadro(
            [[12, 14, 11, 13, 0], [10, 12, 9, 11, 100], [12, 15, 11, 14, None]],
            pd.DatetimeIndex(["2026-10-28", "2026-10-26", "2026-10-28"], tz="America/Sao_Paulo"),
        )
        original = dados.copy(deep=True)
        resultado = preparar_historico(dados)
        self.assertEqual([item["date"] for item in resultado], ["2026-10-26", "2026-10-28"])
        self.assertEqual(resultado[-1]["close"], 14)
        self.assertIsNone(resultado[-1]["volume"])
        pd.testing.assert_frame_equal(dados, original)

    def test_descarta_datas_precos_ausentes_infinitos_e_ohlc_inconsistente(self):
        dados = quadro(
            [[10, 12, 9, 11, 1], [10, 9, 8, 11, 1], [10, 12, 11, 11, 1], [10, float("inf"), 9, 11, 1], [None, 12, 9, 11, 1]],
            ["invalida", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28"],
        )
        self.assertEqual(preparar_historico(dados), [])
        self.assertEqual(preparar_historico(quadro([[10, 12, 9, 11, 1]], [42])), [])

    def test_volume_ausente_invalido_e_zero(self):
        for volume, esperado in [(0, 0), (-1, None), (float("inf"), None), (None, None), (pd.NA, None)]:
            with self.subTest(volume=volume):
                self.assertEqual(preparar_historico(quadro([[10, 12, 9, 11, volume]]))[0]["volume"], esperado)
        dados = quadro([[10, 12, 9, 11, 1]]).drop(columns="Volume")
        self.assertIsNone(preparar_historico(dados)[0]["volume"])

    def test_colunas_ohlc_obrigatorias_e_entrada_vazia(self):
        self.assertEqual(preparar_historico(pd.DataFrame()), [])
        with self.assertRaisesRegex(ValueError, "Colunas ausentes"):
            preparar_historico(pd.DataFrame({"Close": [10]}))


class ContratoTests(unittest.TestCase):
    def test_catalogo_preserva_simbolos_e_distingue_instrumentos(self):
        ativos = {item["id"]: item for item in listar_ativos()}
        self.assertEqual(ativos["dolar"]["ticker"], "BRL=X")
        self.assertIn("vista", ativos["dolar"]["name"])
        self.assertEqual(ativos["ouro"]["ticker"], "GC=F")
        self.assertEqual(ativos["ouro"]["category"], "Futuros")
        self.assertEqual(ativos["ibovespa"]["unit"], "points")
        self.assertNotIn("wdo", ativos)

    def test_combinacoes_de_periodo_e_intervalo(self):
        for periodo in ["5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"]:
            validar_periodo_intervalo(periodo, "1d")
        for periodo, intervalo in [("5d", "1wk"), ("1mo", "1mo"), ("5d", "1mo"), ("1mo", "1m"), ("invalido", "1d")]:
            with self.subTest(periodo=periodo, intervalo=intervalo), self.assertRaises(ValueError):
                validar_periodo_intervalo(periodo, intervalo)
        validar_periodo_intervalo("1mo", "1wk")
        validar_periodo_intervalo("3mo", "1mo")

    @patch("app.providers.yfinance_provider.yf.Ticker")
    def test_provider_encaminha_intervalo_e_preserva_ajuste(self, ticker):
        retorno = quadro([[10, 12, 9, 11, 100]])
        ticker.return_value.history.return_value = retorno
        self.assertIs(obter_historico("petrobras", "3mo", "1wk"), retorno)
        ticker.assert_called_once_with("PETR4.SA")
        ticker.return_value.history.assert_called_once_with(period="3mo", interval="1wk", auto_adjust=False, timeout=10)

    @patch("app.services.market_service.obter_historico")
    def test_history_preserva_campos_e_adiciona_metadados(self, fonte):
        fonte.return_value = quadro([[10, 12, 9, 11, 0]])
        resultado = consultar_historico("petrobras")
        self.assertEqual(resultado["asset"], "petrobras")
        self.assertEqual(resultado["period"], "1mo")
        self.assertEqual(resultado["interval"], "1d")
        self.assertEqual(resultado["currency"], "BRL")
        self.assertEqual(resultado["timezone"], "America/Sao_Paulo")
        self.assertEqual(resultado["count"], 1)
        self.assertEqual(set(resultado["data"][0]), {"date", "open", "high", "low", "close", "volume"})

    @patch("app.services.market_service.obter_historico")
    def test_fuso_ausente_permanece_nulo(self, fonte):
        fonte.return_value = quadro([[10, 12, 9, 11, 0]], pd.DatetimeIndex(["2026-10-28"]))
        self.assertIsNone(consultar_historico("petrobras")["timezone"])

    @patch("app.services.market_service.obter_historico")
    def test_sem_ohlc_valido_nao_produz_candles_artificiais(self, fonte):
        fonte.return_value = quadro([[10, 9, 8, 11, 100]])
        with self.assertRaisesRegex(ValueError, "Nenhum candle OHLC valido"):
            consultar_historico("petrobras")

    @patch("app.routes.market.consultar_historico")
    def test_rota_defaults_intervalos_e_erros_http(self, consultar):
        consultar.return_value = {"data": [], "count": 0}
        status, _ = solicitar("/api/assets/petrobras/history")
        self.assertEqual(status, 200)
        consultar.assert_called_with("petrobras", "1mo", "1d")
        status, _ = solicitar("/api/assets/vale/history", "period=3mo&interval=1wk")
        self.assertEqual(status, 200)
        consultar.assert_called_with("vale", "3mo", "1wk")
        consultar.reset_mock()
        self.assertEqual(solicitar("/api/assets/vale/history", "period=5d&interval=1wk")[0], 400)
        self.assertEqual(solicitar("/api/assets/wdo/history")[0], 404)
        consultar.assert_not_called()
        consultar.side_effect = ValueError("Sem dados disponiveis")
        self.assertEqual(solicitar("/api/assets/vale/history")[0], 404)
        consultar.side_effect = RuntimeError("fonte indisponivel")
        with self.assertLogs(level="ERROR"):
            self.assertEqual(solicitar("/api/assets/vale/history")[0], 502)

    def test_saude_e_catalogo_continuam_disponiveis(self):
        self.assertEqual(solicitar("/health"), (200, {"status": "ok"}))
        status, ativos = solicitar("/api/assets")
        self.assertEqual(status, 200)
        self.assertEqual(len(ativos), 6)


if __name__ == "__main__":
    unittest.main()
