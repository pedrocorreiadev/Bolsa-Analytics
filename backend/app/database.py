"""Persistência local de contas, preferências e sessões, sem serviços externos."""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path


@contextmanager
def conectar():
    caminho = Path(os.getenv("BOLSA_DB_PATH", str(Path(__file__).resolve().parents[1] / "data" / "bolsa.sqlite3")))
    caminho.parent.mkdir(parents=True, exist_ok=True)
    banco = sqlite3.connect(caminho, timeout=10)
    banco.row_factory = sqlite3.Row
    banco.execute("PRAGMA foreign_keys = ON")
    try:
        banco.executescript("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY, nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL, senha_hash TEXT NOT NULL,
                papel TEXT NOT NULL DEFAULT 'usuario' CHECK(papel IN ('usuario', 'admin')),
                criado_em TEXT NOT NULL, preferencias TEXT NOT NULL DEFAULT '{}'
            );
            CREATE TABLE IF NOT EXISTS sessoes (
                token_hash TEXT PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                expira_em INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tentativas (
                chave TEXT PRIMARY KEY, inicio INTEGER NOT NULL, quantidade INTEGER NOT NULL
            );
        """)
        yield banco
        banco.commit()
    except Exception:
        banco.rollback()
        raise
    finally:
        banco.close()
