"""Fluxos HTTP reais em memória, com banco temporário e sem serviços externos."""

import asyncio
import json
import os
import tempfile
import time
import unittest
from http.cookies import SimpleCookie
from unittest.mock import patch

from app.database import conectar
from app.main import app
from app.services.auth_service import COOKIE, cadastrar, limitar_tentativas


def requisitar(caminho, metodo="GET", dados=None, cookie="", protegido=True):
    async def executar():
        mensagens = []
        cabecalhos = [(b"content-type", b"application/json")]
        if protegido:
            cabecalhos.append((b"x-bolsa-client", b"web"))
        if cookie:
            cabecalhos.append((b"cookie", cookie.encode()))

        async def receber():
            return {"type": "http.request", "body": json.dumps(dados).encode() if dados is not None else b"", "more_body": False}

        async def enviar(mensagem):
            mensagens.append(mensagem)

        rota, _, consulta = caminho.partition("?")
        await app({"type": "http", "asgi": {"version": "3.0"}, "method": metodo, "path": rota, "raw_path": rota.encode(),
                   "query_string": consulta.encode(), "headers": cabecalhos, "scheme": "http", "server": ("test", 80), "client": ("test", 1), "root_path": ""}, receber, enviar)
        inicio = next(m for m in mensagens if m["type"] == "http.response.start")
        corpo = b"".join(m.get("body", b"") for m in mensagens if m["type"] == "http.response.body")
        return inicio["status"], json.loads(corpo) if corpo else None, {k.decode(): v.decode() for k, v in inicio["headers"]}

    return asyncio.run(executar())


class ContasTests(unittest.TestCase):
    def setUp(self):
        pasta = tempfile.TemporaryDirectory()
        self.addCleanup(pasta.cleanup)
        ambiente = patch.dict(os.environ, {"BOLSA_DB_PATH": os.path.join(pasta.name, "teste.sqlite3")})
        ambiente.start()
        self.addCleanup(ambiente.stop)
        self.dados = {"nome": "Pessoa Teste", "email": "pessoa@exemplo.com", "senha": "senha de teste longa"}

    def registrar(self, **alteracoes):
        status, usuario, headers = requisitar("/api/auth/register", "POST", {**self.dados, **alteracoes})
        self.assertEqual(status, 201, usuario)
        cookie = SimpleCookie(headers["set-cookie"])
        return usuario, f"{COOKIE}={cookie[COOKIE].value}"

    def test_cadastro_persiste_hash_e_sessao_sem_expor_segredos(self):
        usuario, cookie = self.registrar()
        self.assertEqual(usuario["papel"], "usuario")
        self.assertNotIn("senha_hash", usuario)
        status, conta, headers = requisitar("/api/auth/me", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(conta["id"], usuario["id"])
        self.assertEqual(headers["cache-control"], "no-store")
        with conectar() as banco:
            resumo = banco.execute("SELECT senha_hash FROM usuarios").fetchone()[0]
            token = banco.execute("SELECT token_hash FROM sessoes").fetchone()[0]
        self.assertTrue(resumo.startswith("pbkdf2_sha256$"))
        self.assertNotIn(self.dados["senha"], resumo)
        self.assertNotEqual(token, cookie.split("=", 1)[1])

    def test_login_erro_generico_cookie_seguro_rotacao_e_logout(self):
        _, anterior = self.registrar()
        for email in [self.dados["email"], "naoexiste@exemplo.com"]:
            status, erro, _ = requisitar("/api/auth/login", "POST", {"email": email, "senha": "errada"})
            self.assertEqual((status, erro["detail"]), (401, "E-mail ou senha incorretos."))
        with patch.dict(os.environ, {"BOLSA_COOKIE_SECURE": "true"}):
            status, _, headers = requisitar("/api/auth/login", "POST", {"email": self.dados["email"], "senha": self.dados["senha"]}, anterior)
        self.assertEqual(status, 200)
        self.assertIn("HttpOnly", headers["set-cookie"])
        self.assertIn("Secure", headers["set-cookie"])
        self.assertIn("SameSite=lax", headers["set-cookie"])
        novo = SimpleCookie(headers["set-cookie"])
        cookie = f"{COOKIE}={novo[COOKIE].value}"
        self.assertEqual(requisitar("/api/auth/me", cookie=anterior)[0], 401)
        self.assertEqual(requisitar("/api/auth/logout", "POST", cookie=cookie)[0], 204)
        self.assertEqual(requisitar("/api/auth/me", cookie=cookie)[0], 401)

    def test_permissoes_admin_e_protecao_contra_escalacao(self):
        self.assertEqual(requisitar("/api/admin/dashboard")[0], 401)
        _, cookie = self.registrar()
        self.assertEqual(requisitar("/api/admin/dashboard", cookie=cookie)[0], 403)
        self.assertEqual(requisitar("/api/admin/cache/clear", "POST", cookie=cookie)[0], 403)
        self.assertEqual(requisitar("/api/auth/register", "POST", {**self.dados, "papel": "admin"})[0], 422)
        cadastrar("Admin", "admin@exemplo.com", "senha longa admin", papel="admin")
        _, _, headers = requisitar("/api/auth/login", "POST", {"email": "admin@exemplo.com", "senha": "senha longa admin"})
        cookie_admin = headers["set-cookie"].split(";", 1)[0]
        status, dashboard, _ = requisitar("/api/admin/dashboard", cookie=cookie_admin)
        self.assertEqual(status, 200)
        self.assertEqual(dashboard["total_usuarios"], 2)
        self.assertEqual(dashboard["total_admins"], 1)
        self.assertNotIn("senha_hash", json.dumps(dashboard))
        self.assertEqual(requisitar("/api/admin/cache/clear", "POST", cookie=cookie_admin)[0], 204)

    def test_perfil_preferencias_validacao_e_isolamento(self):
        primeiro, cookie = self.registrar()
        segundo, outro_cookie = self.registrar(email="outra@exemplo.com")
        preferencias = {"ativo": "vale", "periodo": "6mo", "horizonte": 20, "atualizacao": 60, "favoritos": ["vale", "dolar", "vale"]}
        self.assertEqual(requisitar("/api/auth/preferences", "PUT", preferencias, cookie)[0], 200)
        self.assertEqual(requisitar("/api/auth/profile", "PATCH", {"nome": "Novo nome"}, cookie)[0], 200)
        _, conta, _ = requisitar("/api/auth/me", cookie=cookie)
        self.assertEqual(conta["nome"], "Novo nome")
        self.assertEqual(conta["preferencias"]["favoritos"], ["vale", "dolar"])
        _, outra, _ = requisitar("/api/auth/me", cookie=outro_cookie)
        self.assertNotEqual(primeiro["id"], segundo["id"])
        self.assertEqual(outra["preferencias"]["favoritos"], [])
        for invalido in [{"ativo": "invalido"}, {"atualizacao": 1}, {"horizonte": 200}, {"favoritos": ["fake"]}]:
            self.assertEqual(requisitar("/api/auth/preferences", "PUT", {**preferencias, **invalido}, cookie)[0], 422)
        self.assertEqual(requisitar("/api/auth/profile", "PATCH", {"nome": "X", "papel": "admin"}, cookie)[0], 422)

    def test_mutacoes_exigem_cabecalho_e_cadastro_valido(self):
        self.assertEqual(requisitar("/api/auth/register", "POST", self.dados, protegido=False)[0], 403)
        for campos in [{"senha": "curta"}, {"email": "naoeemail"}, {"nome": "   "}]:
            self.assertEqual(requisitar("/api/auth/register", "POST", {**self.dados, **campos})[0], 422)
        _, cookie = self.registrar()
        self.assertEqual(requisitar("/api/auth/logout", "POST", cookie=cookie, protegido=False)[0], 403)
        self.assertEqual(requisitar("/api/auth/register", "POST", {**self.dados, "email": self.dados["email"].upper()})[0], 409)

    def test_senha_alterada_revoga_outras_sessoes_e_preserva_atual(self):
        _, atual = self.registrar()
        _, _, headers = requisitar("/api/auth/login", "POST", {"email": self.dados["email"], "senha": self.dados["senha"]})
        outra = headers["set-cookie"].split(";", 1)[0]
        self.assertEqual(requisitar("/api/auth/password", "POST", {"senha_atual": "errada", "nova_senha": "nova senha longa"}, atual)[0], 400)
        self.assertEqual(requisitar("/api/auth/password", "POST", {"senha_atual": self.dados["senha"], "nova_senha": "nova senha longa"}, atual)[0], 204)
        self.assertEqual(requisitar("/api/auth/me", cookie=atual)[0], 200)
        self.assertEqual(requisitar("/api/auth/me", cookie=outra)[0], 401)
        self.assertEqual(requisitar("/api/auth/login", "POST", {"email": self.dados["email"], "senha": self.dados["senha"]})[0], 401)
        self.assertEqual(requisitar("/api/auth/login", "POST", {"email": self.dados["email"], "senha": "nova senha longa"})[0], 200)

    def test_sessao_expirada_e_limite_persistente_de_tentativas(self):
        _, cookie = self.registrar()
        with conectar() as banco:
            banco.execute("UPDATE sessoes SET expira_em = ?", (int(time.time()) - 1,))
        self.assertEqual(requisitar("/api/auth/me", cookie=cookie)[0], 401)
        for _ in range(10):
            limitar_tentativas(f"login:{self.dados['email']}")
        status, _, headers = requisitar("/api/auth/login", "POST", {"email": self.dados["email"], "senha": self.dados["senha"]})
        self.assertEqual(status, 429)
        self.assertEqual(headers["retry-after"], "900")
