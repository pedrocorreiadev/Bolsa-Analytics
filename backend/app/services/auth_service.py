"""Autenticação com senha derivada, sessão revogável e autorização no servidor."""

import hashlib
import hmac
import json
import secrets
import sqlite3
import time
from datetime import datetime, timezone

from fastapi import HTTPException, Request

from app.database import conectar

COOKIE = "bolsa_sessao"
DURACAO_SESSAO = 60 * 60 * 12
ITERACOES_SENHA = 600_000
PREFERENCIAS_PADRAO = {"ativo": "petrobras", "periodo": "3mo", "horizonte": 10, "atualizacao": 0, "favoritos": []}


def derivar_senha(senha: str, sal: str | None = None) -> str:
    sal = sal or secrets.token_hex(16)
    resumo = hashlib.pbkdf2_hmac("sha256", senha.encode(), bytes.fromhex(sal), ITERACOES_SENHA).hex()
    return f"pbkdf2_sha256${sal}${resumo}"


def conferir_senha(senha: str, armazenada: str) -> bool:
    try:
        _, sal, _ = armazenada.split("$")
        return hmac.compare_digest(derivar_senha(senha, sal), armazenada)
    except (ValueError, TypeError):
        return False


def usuario_publico(linha) -> dict:
    return {"id": linha["id"], "nome": linha["nome"], "email": linha["email"], "papel": linha["papel"],
            "criado_em": linha["criado_em"], "preferencias": {**PREFERENCIAS_PADRAO, **json.loads(linha["preferencias"])}}


def cadastrar(nome: str, email: str, senha: str, papel: str = "usuario") -> dict:
    resumo = derivar_senha(senha)
    try:
        with conectar() as banco:
            registro = banco.execute(
                "INSERT INTO usuarios (nome, email, senha_hash, papel, criado_em) VALUES (?, ?, ?, ?, ?)",
                (nome, email.lower(), resumo, papel, datetime.now(timezone.utc).isoformat()),
            )
            return usuario_publico(banco.execute("SELECT * FROM usuarios WHERE id = ?", (registro.lastrowid,)).fetchone())
    except sqlite3.IntegrityError as erro:
        raise HTTPException(409, "Já existe uma conta com este e-mail.") from erro


def limitar_tentativas(chave: str, limite: int = 10):
    """Limite persistente por origem/conta; não depende de um único worker."""
    agora = int(time.time())
    bloqueada = False
    with conectar() as banco:
        banco.execute("DELETE FROM tentativas WHERE inicio < ?", (agora - 900,))
        banco.execute("INSERT INTO tentativas VALUES (?, ?, 1) ON CONFLICT(chave) DO UPDATE SET quantidade = quantidade + 1", (chave, agora))
        bloqueada = banco.execute("SELECT quantidade FROM tentativas WHERE chave = ?", (chave,)).fetchone()[0] > limite
    if bloqueada:
        raise HTTPException(429, "Muitas tentativas. Aguarde 15 minutos.", headers={"Retry-After": "900"})


def autenticar(email: str, senha: str) -> dict:
    with conectar() as banco:
        linha = banco.execute("SELECT * FROM usuarios WHERE email = ?", (email.lower(),)).fetchone()
    # Faz a mesma derivação quando a conta não existe.
    resumo = linha["senha_hash"] if linha else f"pbkdf2_sha256${'0' * 32}${'0' * 64}"
    correta = conferir_senha(senha, resumo)
    if not linha or not correta:
        raise HTTPException(401, "E-mail ou senha incorretos.")
    return usuario_publico(linha)


def resumo_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def criar_sessao(usuario_id: int, anterior: str | None = None) -> str:
    token = secrets.token_urlsafe(32)
    agora = int(time.time())
    with conectar() as banco:
        banco.execute("DELETE FROM sessoes WHERE expira_em <= ?", (agora,))
        if anterior:
            banco.execute("DELETE FROM sessoes WHERE token_hash = ?", (resumo_token(anterior),))
        banco.execute("INSERT INTO sessoes VALUES (?, ?, ?)", (resumo_token(token), usuario_id, agora + DURACAO_SESSAO))
    return token


def usuario_atual(request: Request) -> dict:
    token = request.cookies.get(COOKIE, "")
    with conectar() as banco:
        linha = banco.execute("""SELECT u.* FROM usuarios u JOIN sessoes s ON s.usuario_id = u.id
            WHERE s.token_hash = ? AND s.expira_em > ?""", (resumo_token(token), int(time.time()))).fetchone()
    if linha is None:
        raise HTTPException(401, "Entre na sua conta para continuar.")
    return usuario_publico(linha)


def exigir_admin(request: Request) -> dict:
    usuario = usuario_atual(request)
    if usuario["papel"] != "admin":
        raise HTTPException(403, "Esta área é exclusiva para administradores.")
    return usuario


def exigir_cliente(request: Request):
    # Cabeçalho não simples exige preflight em outra origem. Formulários e
    # requisições cross-site não conseguem realizar mutações autenticadas.
    if request.headers.get("X-Bolsa-Client") != "web":
        raise HTTPException(403, "Requisição sem proteção de origem.")
