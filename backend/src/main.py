from fastapi import FastAPI
# Adicionamos o 'appointment' na nossa lista de importações
from src.api.v1.endpoints import tenants, user, auth, customer, appointment

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

app.include_router(
    user.router,
    prefix="/api/v1"
)

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Autenticação"]
)

app.include_router(
    customer.router,
    prefix="/api/v1"
)

# 👇 NOSSA NOVA ADIÇÃO: O Roteador de Agendamentos!
app.include_router(
    appointment.router,
    prefix="/api/v1"
)
