from fastapi import FastAPI
# Adicionamos o 'user' e agora o 'customer' na nossa lista de importações
from src.api.v1.endpoints import tenants, user, auth, customer

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

# Registrando o nosso roteador de Usuários.
# Como o router lá no arquivo user.py já possui o prefix="/users",
# aqui nós apenas empacotamos ele na versão v1 da API.
# O resultado final das rotas será: /api/v1/users/...
app.include_router(
    user.router,
    prefix="/api/v1"
)

# Registrando o Roteador de Autenticação
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Autenticação"]
)

# 👇 NOSSA NOVA ADIÇÃO: O Roteador de Clientes!
# Como o router lá no arquivo customer.py já possui o prefix="/customers",
# o resultado final será: /api/v1/customers/...
app.include_router(
    customer.router,
    prefix="/api/v1"
)
