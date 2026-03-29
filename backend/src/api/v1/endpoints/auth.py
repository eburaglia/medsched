from typing import Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import secrets
import string

from src.database import get_db
from src.crud import user as crud_user
from src.crud import super_admin as crud_super_admin
from src.core.security import verify_password, get_password_hash
from src.core.auth import create_access_token
from src.schemas.token import Token

router = APIRouter()

# Schema para receber o E-mail do Frontend
class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    
    # 1. Tenta buscar o usuário nas Clínicas (Tenants)
    user = crud_user.get_user_by_email(db, email=form_data.username)
    
    if user:
        # Verifica a senha oficial
        is_valid = verify_password(form_data.password, user.senha_hash)
        
        # Se a oficial falhou, verifica se existe uma senha temporária VÁLIDA (Dentro de 2 horas)
        if not is_valid and user.recuperacao_token and user.recuperacao_expira:
            if datetime.utcnow() <= user.recuperacao_expira:
                is_valid = verify_password(form_data.password, user.recuperacao_token)
                
        if is_valid:
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

    # 3. Se não achar em nenhum dos dois, ou a senha/temporária falhar
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="E-mail ou senha incorretos (ou senha temporária expirada)",
        headers={"WWW-Authenticate": "Bearer"},
    )

# 🚀 NOVA ROTA: Esqueci minha senha
@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    
    user = crud_user.get_user_by_email(db, email=request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="E-mail não encontrado em nossa base de dados."
        )

    if hasattr(user.status, 'value') and user.status.value == "INATIVO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo. Entre em contato com a administração."
        )

    # 1. Gera senha temporária de 8 caracteres aleatórios (letras e números)
    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for i in range(8))
    
    # 2. Faz o hash da senha temporária para guardar com segurança
    hashed_temp_password = get_password_hash(temp_password)
    
    # 3. Define a validade de 2 horas (UTC)
    expiration = datetime.utcnow() + timedelta(hours=2)
    
    # 4. Atualiza o banco de dados
    user.recuperacao_token = hashed_temp_password
    user.recuperacao_expira = expiration
    db.commit()

    # 🚧 MOCK: Imprime no console do Docker enquanto não ligamos o WhatsApp/E-mail
    print("\n" + "="*50)
    print("🔒 SOLICITAÇÃO DE RECUPERAÇÃO DE SENHA")
    print(f"👤 Usuário: {user.nome}")
    print(f"📧 E-mail: {user.email}")
    print(f"🔑 SENHA TEMPORÁRIA: {temp_password}")
    print(f"⏳ Expira em: {expiration} (UTC)")
    print("="*50 + "\n")

    return {"message": "Instruções enviadas com sucesso."}
