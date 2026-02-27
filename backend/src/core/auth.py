from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import os

# Buscamos as configurações das variáveis de ambiente
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-chave-nao-segura")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

def create_access_token(user_id: str, tenant_id: str) -> str:
    """
    Gera um token JWT contendo a identidade do usuário e o seu Tenant.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # O 'sub' (subject) é o ID do usuário. 
    # Incluímos o 'tenant_id' para facilitar o isolamento nas rotas.
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "tenant_id": str(tenant_id)
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
