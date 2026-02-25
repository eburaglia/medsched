from fastapi import FastAPI
from src.api.v1.endpoints import tenants

# Inicializa o cérebro da nossa API
app = FastAPI(
    title="MedSched API",
    description="Backend Multi-Tenant de Agendamento de Serviços",
    version="0.1.0"
)

# Rota raiz (Health Check)
@app.get("/")
def health_check():
    return {
        "status": "online",
        "mensagem": "Cérebro MedSched operando com sucesso!",
        "arquitetura": "FastAPI + Docker"
    }

# ---------------------------------------------------------
# REGISTRO DOS ROTEADORES (Endpoints da API)
# ---------------------------------------------------------
app.include_router(
    tenants.router, 
    prefix="/api/v1/tenants", 
    tags=["Tenants (Clínicas e Empresas)"]
)
