import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.schemas.token import TokenPayload

# Esta linha cria o botão "Authorize" no Swagger e define a URL de login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Dependência central de segurança.
    Intercepta o Token JWT, valida a assinatura e devolve o usuário do banco.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Busca as variáveis de ambiente
        secret_key = os.getenv("SECRET_KEY", "fallback-chave-nao-segura")
        algorithm = os.getenv("ALGORITHM", "HS256")
        
        # Tenta decodificar o token
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
        token_data = TokenPayload(**payload)
        
    except JWTError:
        raise credentials_exception

    # Vai ao banco de dados validar se o usuário ainda existe
    user = db.query(User).filter(User.id == token_data.sub).first()
    
    if user is None:
        raise credentials_exception
        
    # Bloqueia usuários inativos (usando .value por causa do Enum do SQLAlchemy)
    if user.status.value == "INATIVO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Usuário inativo. Acesso negado."
        )
        
    return user
