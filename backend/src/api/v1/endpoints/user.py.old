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

# 👇 A CORREÇÃO: Usando o cargo real do banco de dados
require_tenant_admin = RoleChecker(["TENANT_ADMIN"])

# ---------------------------------------------------------
# 🛡 ENDPOINT: BUSCAR PERFIL LOGADO (/me)
# ---------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do próprio usuário autenticado.
    """
    return current_user

# ---------------------------------------------------------
# ✍ ENDPOINT: CRIAR USUÁRIO
# ---------------------------------------------------------
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin)
):
    if str(current_user.tenant_id) != str(user_in.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode criar usuários para outra clínica."
        )

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
    current_user: User = Depends(require_tenant_admin)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para listar dados de outra clínica."
        )

    users = crud_user.get_users_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)
    return users

# ---------------------------------------------------------
# 🔍 ENDPOINT: BUSCAR UM USUÁRIO ESPECÍFICO
# ---------------------------------------------------------
@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: UUID, 
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar dados de outra clínica."
        )

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
    current_user: User = Depends(require_tenant_admin)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar dados de outra clínica."
        )

    user = crud_user.get_user_by_id(db=db, user_id=user_id, tenant_id=tenant_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )
    
    user_updated = crud_user.update_user(db=db, db_user=user, obj_in=user_in)
    return user_updated
