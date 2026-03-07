import os
from datetime import datetime, timedelta
from jose import jwt

# Parâmetros de segurança (Ideais puxar do .env)
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-chave-nao-segura")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

def create_access_token(user_id: str, tenant_id: str = None, role: str = None) -> str:
    """
    Gera o crachá digital (Token JWT) com prazo de validade.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Monta a maleta (payload) com os dados
    to_encode = {
        "exp": expire,
        "sub": str(user_id)
    }
    
    # Injeta dados opcionais (Para o Super Admin o tenant é None)
    if tenant_id:
        to_encode["tenant_id"] = str(tenant_id)
    if role:
        to_encode["role"] = str(role)

    # Lacra a maleta com a chave secreta
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
