from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.v1.endpoints import tenants, user, auth, customer, appointment, service, resource, import_data, service_record, utils, dashboard, finance

# Inicializa o cérebro da nossa API
app = FastAPI(
    title="MedSched API",
    description="Backend Multi-Tenant de Agendamento de Serviços",
    version="0.1.0"
)

# ---------------------------------------------------------
# CONFIGURAÇÃO DE SEGURANÇA (CORS)
# ---------------------------------------------------------
# Isso permite que o Frontend (porta 40005) converse com o Backend (porta 40000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # Permite requisições de qualquer IP (útil no desenvolvimento)
    allow_credentials=False, # Como usamos Token no Header, não precisamos de Cookies aqui
    allow_methods=["*"],     # Permite todos os métodos (GET, POST, PUT, DELETE)
    allow_headers=["*"],     # Permite todos os cabeçalhos de segurança
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

app.include_router(
    appointment.router,
    prefix="/api/v1"
)

app.include_router(
    service.router,
    prefix="/api/v1"
)

app.include_router(
    resource.router,
    prefix="/api/v1"
)

app.include_router(
    import_data.router,
    prefix="/api/v1"
)

app.include_router(
    service_record.router,
    prefix="/api/v1"
)

#app.include_router(
#    financial.router,
#    prefix="/api/v1"
#)

app.include_router(
    utils.router,
    prefix="/api/v1"
)

app.include_router(
    dashboard.router,
    prefix="/api/v1"
)

# O NOVO MOTOR FINANCEIRO E DE COMISSIONAMENTO
app.include_router(
    finance.router,
    prefix="/api/v1/finance",
    tags=["Financeiro e Caixa"]
)
