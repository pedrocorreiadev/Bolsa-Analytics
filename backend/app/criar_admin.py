"""Execute: python -m app.criar_admin --email pessoa@exemplo.com --nome Nome"""

import argparse
import getpass

from app.database import conectar
from app.routes.auth import Cadastro
from app.services.auth_service import cadastrar


def main():
    argumentos = argparse.ArgumentParser(description="Cria um administrador local sem senha padrão.")
    argumentos.add_argument("--email", required=True)
    argumentos.add_argument("--nome", required=True)
    dados = argumentos.parse_args()
    with conectar() as banco:
        if banco.execute("SELECT id FROM usuarios WHERE email = ?", (dados.email.strip().lower(),)).fetchone():
            argumentos.error("E-mail já cadastrado. Use outro e-mail para o administrador.")
    senha = getpass.getpass("Senha (mínimo de 10 caracteres): ")
    if senha != getpass.getpass("Repita a senha: "):
        argumentos.error("As senhas não coincidem.")
    cadastro = Cadastro(nome=dados.nome, email=dados.email, senha=senha)
    cadastrar(cadastro.nome, cadastro.email, cadastro.senha, papel="admin")
    print("Administrador criado. Entre pela tela de login.")


if __name__ == "__main__":
    main()
