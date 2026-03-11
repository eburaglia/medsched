from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.user import UserCreate, UserUpdate, UserResponse
from src.crud import user as crud_user
from src.api.deps import get_current_user, RoleChecker
from src.models.user import User

# ---------------------------------------------------------
# 🚦 CONFIGURAÇÃO DO ROTEADOR E SEGURANÇA
# ---------------------------------------------------------
router = APIRouter(
    prefix="/users",
    tags=["Usuários"]
)

# A CORREÇÃO DE OURO: Permitindo os administradores da plataforma
require_admin_or_tenant = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR"])

# Função utilitária para checar a Impersonação
def verify_tenant_access(current_user: User, target_tenant_id: UUID):
    # Se for super_admin ou system_admin, tem o passe livre (Impersonação)
    if current_user.papel in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        return True
    
    # Se for tenant_admin normal, ele SÓ PODE mexer na própria clínica
    if str(current_user.tenant_id) != str(target_tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar ou modificar dados de outra clínica."
        )

# ---------------------------------------------------------
# 🛡 ENDPOINT: BUSCAR PERFIL LOGADO (/me)
# ---------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

# ---------------------------------------------------------
# ✍ ENDPOINT: CRIAR USUÁRIO
# ---------------------------------------------------------
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_tenant)
):
    verify_tenant_access(current_user, user_in.tenant_id)

    user_exists = crud_user.get_user_by_email(db, email=user_in.email)
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )
    return crud_user.create_user(db=db, obj_in=user_in)

# ---------------------------------------------------------
# 🔍 ENDPOINT: LISTAR USUÁRIOS
# ---------------------------------------------------------
@router.get("/", response_model=List[UserResponse])
def read_users(
    tenant_id: UUID, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_tenant)
):
    verify_tenant_access(current_user, tenant_id)
    return crud_user.get_users_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)

# ---------------------------------------------------------
# 🔍 ENDPOINT: BUSCAR UM USUÁRIO ESPECÍFICO
# ---------------------------------------------------------
@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: UUID, 
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_tenant)
):
    verify_tenant_access(current_user, tenant_id)

    user = crud_user.get_user_by_id(db=db, user_id=user_id, tenant_id=tenant_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )
    return user

# ---------------------------------------------------------
# 🔄 ENDPOINT: ATUALIZAR USUÁRIO
# ---------------------------------------------------------
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID, 
    tenant_id: UUID, 
    user_in: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_tenant)
):
    verify_tenant_access(current_user, tenant_id)

    user = crud_user.get_user_by_id(db=db, user_id=user_id, tenant_id=tenant_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )
    
    user_updated = crud_user.update_user(db=db, db_user=user, obj_in=user_in)
    return user_updated
