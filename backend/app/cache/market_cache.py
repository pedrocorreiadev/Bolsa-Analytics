"""Cache curto por consulta, com exclusão mútua para evitar coletas repetidas."""

import copy
import threading
import time
from collections import deque
from datetime import datetime, timezone

TTL = 60
_trava = threading.RLock()
_travas_consulta = {}
_entradas = {}
_eventos = deque(maxlen=50)
_contadores = {"consultas_fonte": 0, "acertos_cache": 0, "falhas": 0, "registros_validos": 0, "registros_descartados": 0}


def consultar_com_cache(ativo, periodo, intervalo, carregar):
    chave = (ativo, periodo, intervalo)
    with _trava:
        trava_consulta = _travas_consulta.setdefault(chave, threading.Lock())
    with trava_consulta:
        with _trava:
            entrada = _entradas.get(chave)
            if entrada and entrada[0] > time.monotonic():
                _contadores["acertos_cache"] += 1
                return {**copy.deepcopy(entrada[1]), "cached": True}
        inicio = time.monotonic()
        evento = {"ativo": ativo, "periodo": periodo, "intervalo": intervalo, "em": datetime.now(timezone.utc).isoformat()}
        try:
            resultado = carregar(ativo, periodo, intervalo)
        except Exception:
            with _trava:
                _contadores["consultas_fonte"] += 1
                _contadores["falhas"] += 1
                _eventos.appendleft({**evento, "status": "falha", "registros": 0, "duracao_ms": round((time.monotonic() - inicio) * 1000)})
            raise
        with _trava:
            _contadores["consultas_fonte"] += 1
            _contadores["registros_validos"] += resultado.get("count", 0)
            _contadores["registros_descartados"] += resultado.get("quality", {}).get("discarded", 0)
            _eventos.appendleft({**evento, "status": "ok", "registros": resultado.get("count", 0), "duracao_ms": round((time.monotonic() - inicio) * 1000)})
            _entradas[chave] = (time.monotonic() + TTL, copy.deepcopy(resultado))
        return {**resultado, "cached": False}


def limpar_cache():
    with _trava:
        _entradas.clear()


def resumo_coleta():
    with _trava:
        return {**_contadores, "entradas_cache": sum(item[0] > time.monotonic() for item in _entradas.values()),
                "ttl_segundos": TTL, "eventos": list(_eventos), "escopo": "Processo atual da API; reinicia com o servidor."}
