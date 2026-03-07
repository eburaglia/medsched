import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.models.super_admin import SuperAdmin
from src.schemas.token import TokenPayload
from typing import List

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        secret_key = os.getenv("SECRET_KEY", "fallback-chave-nao-segura")
        algorithm = os.getenv("ALGORITHM", "HS256")
        
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Lógica Híbrida: Verifica se o token pertence a um Super Admin
    if role == "SUPER_ADMIN":
        user = db.query(SuperAdmin).filter(SuperAdmin.id == user_id).first()
        if user is None or user.status.value == "inativo":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso Super Admin negado.")
        # Criamos uma propriedade 'papel' temporária (mock) no objeto SuperAdmin para que a função RoleChecker não quebre ao tentar validar.
        user.papel = "SUPER_ADMIN"
        return user
        
    # Lógica Normal: Usuário da clínica
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    if hasattr(user.status, 'value') and user.status.value == "INATIVO":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário inativo. Acesso negado.")
        
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user = Depends(get_current_user)):
        user_role = current_user.papel.value if hasattr(current_user.papel, 'value') else current_user.papel

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operação não permitida. Privilégios insuficientes."
            )
        return current_user
