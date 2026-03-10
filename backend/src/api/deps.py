import os
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.user import User
from src.models.super_admin import SuperAdmin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    x_tenant_id: str = Header(None, alias="X-Tenant-ID") # Lendo o cabeçalho mágico
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

    # LÓGICA DO SUPER ADMIN + MÁSCARA MULTI-TENANT
    if role in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        user = db.query(SuperAdmin).filter(SuperAdmin.id == user_id).first()
        if user is None or user.status.value == "inativo":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso Super Admin negado.")
        
        # Propriedade temporária para o RoleChecker
        user.papel = "SUPER_ADMIN"
        
        # Se o Frontend mandou a clínica escolhida no dropdown, o Super Admin "veste" esse ID
        if x_tenant_id:
            user.tenant_id = x_tenant_id
        else:
            user.tenant_id = None
            
        return user
        
    # LÓGICA DO USUÁRIO NORMAL (Não pode usar máscara)
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
        user_role = current_user.papel.value if hasattr(current_user.papel, 'value') else getattr(current_user, 'papel', '')

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operação não permitida. Privilégios insuficientes."
            )
        return current_user
