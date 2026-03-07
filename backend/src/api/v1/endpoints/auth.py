from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.database import get_db
from src.crud import user as crud_user
from src.crud import super_admin as crud_super_admin
from src.core.security import verify_password
from src.core.auth import create_access_token
from src.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    
    # 1. Tenta buscar o usuário nas Clínicas (Tenants)
    user = crud_user.get_user_by_email(db, email=form_data.username)
    
    if user and verify_password(form_data.password, user.senha_hash):
        if user.status.value == "INATIVO":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo.")
            
        access_token = create_access_token(
            user_id=user.id, 
            tenant_id=user.tenant_id,
            role=user.papel.value if hasattr(user.papel, 'value') else user.papel
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    # 2. Se não achar na Clínica, tenta buscar no nível Global (Super Admin)
    super_user = crud_super_admin.get_super_admin_by_email(db, email=form_data.username)
    
    if super_user and verify_password(form_data.password, super_user.senha_hash):
        if super_user.status.value == "inativo":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Super Admin inativo.")
            
        # Super Admin não tem tenant_id atrelado.
        access_token = create_access_token(
            user_id=super_user.id, 
            tenant_id=None,
            role="SUPER_ADMIN"
        )
        return {"access_token": access_token, "token_type": "bearer"}

    # 3. Se não achar em nenhum dos dois, falha.
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="E-mail ou senha incorretos",
        headers={"WWW-Authenticate": "Bearer"},
    )
