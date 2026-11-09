from fastapi import APIRouter, Depends, Response

from app.cache.market_cache import limpar_cache, resumo_coleta
from app.database import conectar
from app.providers.yfinance_provider import ATIVOS
from app.services.auth_service import exigir_admin, exigir_cliente

router = APIRouter(prefix="/api/admin", tags=["Administração"], dependencies=[Depends(exigir_admin)])


@router.get("/dashboard")
def dashboard(response: Response):
    response.headers["Cache-Control"] = "no-store"
    with conectar() as banco:
        usuarios = [dict(linha) for linha in banco.execute("SELECT id, nome, email, papel, criado_em FROM usuarios ORDER BY id DESC")]
    return {"usuarios": usuarios, "total_usuarios": len(usuarios), "total_admins": sum(u["papel"] == "admin" for u in usuarios),
            "ativos": len(ATIVOS), "coleta": resumo_coleta()}


@router.post("/cache/clear", dependencies=[Depends(exigir_cliente)], status_code=204)
def invalidar_cache():
    limpar_cache()
