import json
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.database import conectar
from app.providers.yfinance_provider import ATIVOS
from app.services.auth_service import (
    COOKIE, DURACAO_SESSAO, autenticar, cadastrar, conferir_senha, criar_sessao,
    derivar_senha, exigir_cliente, limitar_tentativas, resumo_token, usuario_atual, usuario_publico,
)

router = APIRouter(prefix="/api/auth", tags=["Conta"])


class Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(max_length=254)
    senha: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def email_valido(cls, valor):
        valor = valor.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", valor):
            raise ValueError("Informe um e-mail válido.")
        return valor


class Cadastro(Entrada):
    nome: str = Field(min_length=2, max_length=80)
    senha: str = Field(min_length=10, max_length=128)

    @field_validator("nome")
    @classmethod
    def nome_valido(cls, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise ValueError("Informe seu nome.")
        return valor


class Perfil(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    nome: str = Field(min_length=2, max_length=80)


class Preferencias(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ativo: str = "petrobras"
    periodo: str = "3mo"
    horizonte: int = 10
    atualizacao: int = 0
    favoritos: list[str] = Field(default_factory=list, max_length=9)

    @field_validator("ativo")
    @classmethod
    def ativo_valido(cls, valor):
        if valor not in ATIVOS:
            raise ValueError("Ativo inválido.")
        return valor

    @field_validator("periodo")
    @classmethod
    def periodo_valido(cls, valor):
        if valor not in {"1mo", "3mo", "6mo", "1y", "2y", "5y"}:
            raise ValueError("Período inválido.")
        return valor

    @field_validator("horizonte")
    @classmethod
    def horizonte_valido(cls, valor):
        if valor not in {5, 10, 20}:
            raise ValueError("Escolha 5, 10 ou 20 observações.")
        return valor

    @field_validator("atualizacao")
    @classmethod
    def atualizacao_valida(cls, valor):
        if valor not in {0, 60, 300}:
            raise ValueError("Atualização inválida.")
        return valor

    @field_validator("favoritos")
    @classmethod
    def favoritos_validos(cls, valor):
        if any(item not in ATIVOS for item in valor):
            raise ValueError("Favorito inválido.")
        return list(dict.fromkeys(valor))


class NovaSenha(BaseModel):
    model_config = ConfigDict(extra="forbid")
    senha_atual: str = Field(min_length=1, max_length=128)
    nova_senha: str = Field(min_length=10, max_length=128)


def iniciar_sessao(request, response, usuario):
    token = criar_sessao(usuario["id"], request.cookies.get(COOKIE))
    response.set_cookie(COOKIE, token, max_age=DURACAO_SESSAO, httponly=True,
                        secure=os.getenv("BOLSA_COOKIE_SECURE", "false").lower() == "true", samesite="lax", path="/")
    response.headers["Cache-Control"] = "no-store"
    return usuario


@router.post("/register", dependencies=[Depends(exigir_cliente)], status_code=201)
def registrar(dados: Cadastro, request: Request, response: Response):
    limitar_tentativas(f"cadastro:{request.client.host if request.client else 'local'}", 10)
    return iniciar_sessao(request, response, cadastrar(dados.nome, dados.email, dados.senha))


@router.post("/login", dependencies=[Depends(exigir_cliente)])
def entrar(dados: Entrada, request: Request, response: Response):
    limitar_tentativas(f"login:{dados.email}")
    limitar_tentativas(f"origem:{request.client.host if request.client else 'local'}", 50)
    return iniciar_sessao(request, response, autenticar(dados.email, dados.senha))


@router.get("/me")
def minha_conta(response: Response, usuario=Depends(usuario_atual)):
    response.headers["Cache-Control"] = "no-store"
    return usuario


@router.post("/logout", dependencies=[Depends(exigir_cliente)], status_code=204)
def sair(request: Request, response: Response):
    with conectar() as banco:
        banco.execute("DELETE FROM sessoes WHERE token_hash = ?", (resumo_token(request.cookies.get(COOKIE, "")),))
    response.delete_cookie(COOKIE, path="/")


@router.patch("/profile", dependencies=[Depends(exigir_cliente)])
def salvar_perfil(dados: Perfil, usuario=Depends(usuario_atual)):
    with conectar() as banco:
        banco.execute("UPDATE usuarios SET nome = ? WHERE id = ?", (dados.nome, usuario["id"]))
        return usuario_publico(banco.execute("SELECT * FROM usuarios WHERE id = ?", (usuario["id"],)).fetchone())


@router.put("/preferences", dependencies=[Depends(exigir_cliente)])
def salvar_preferencias(dados: Preferencias, usuario=Depends(usuario_atual)):
    with conectar() as banco:
        banco.execute("UPDATE usuarios SET preferencias = ? WHERE id = ?", (json.dumps(dados.model_dump()), usuario["id"]))
        return usuario_publico(banco.execute("SELECT * FROM usuarios WHERE id = ?", (usuario["id"],)).fetchone())


@router.post("/password", dependencies=[Depends(exigir_cliente)], status_code=204)
def trocar_senha(dados: NovaSenha, request: Request, usuario=Depends(usuario_atual)):
    limitar_tentativas(f"senha:{usuario['id']}")
    with conectar() as banco:
        linha = banco.execute("SELECT senha_hash FROM usuarios WHERE id = ?", (usuario["id"],)).fetchone()
        if not conferir_senha(dados.senha_atual, linha[0]):
            raise HTTPException(400, "A senha atual está incorreta.")
        banco.execute("UPDATE usuarios SET senha_hash = ? WHERE id = ?", (derivar_senha(dados.nova_senha), usuario["id"]))
        banco.execute("DELETE FROM sessoes WHERE usuario_id = ? AND token_hash != ?", (usuario["id"], resumo_token(request.cookies.get(COOKIE, ""))))
