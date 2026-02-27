from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.database import get_db
from src.crud import user as crud_user
from src.core.security import verify_password
from src.core.auth import create_access_token
from src.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Autenticação OAuth2 para obter o token JWT.
    """
    # 1. Busca o usuário pelo e-mail
    # Nota: O OAuth2 usa o campo 'username' por padrão, então mapeamos nosso e-mail para ele.
    user = crud_user.get_user_by_email(db, email=form_data.username)
    
    # 2. Verifica se o usuário existe e se a senha está correta
    if not user or not verify_password(form_data.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Verifica se a conta não está inativa (Regra de Negócio)
    if user.status.value == "INATIVO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo. Entre em contato com o suporte."
        )

    # 4. Gera o Token JWT com o ID do usuário e o Tenant ID
    access_token = create_access_token(
        user_id=user.id, 
        tenant_id=user.tenant_id
    )
    
    # 5. Retorna o crachá digital
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
