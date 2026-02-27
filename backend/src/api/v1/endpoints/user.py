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

# Instanciamos o verificador de papéis (Apenas ADMINs)
require_admin = RoleChecker(["ADMIN"])

# ---------------------------------------------------------
# 🛡️ ENDPOINT: BUSCAR PERFIL LOGADO (/me)
# ---------------------------------------------------------
# Rota livre para qualquer usuário autenticado ver seu próprio perfil.
@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do próprio usuário autenticado.
    """
    return current_user

# ---------------------------------------------------------
# ✍ ENDPOINT: CRIAR USUÁRIO (SOMENTE ADMIN)
# ---------------------------------------------------------
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin) # 👈 Bloqueado para ADMIN
):
    """
    Cria um novo usuário no sistema.
    Acesso restrito a usuários com papel de ADMIN.
    """
    # 1. O Admin só pode criar usuários para a própria clínica dele
    if str(current_user.tenant_id) != str(user_in.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode criar usuários para outra clínica."
        )

    # 2. Verifica se o e-mail já existe
    user_exists = crud_user.get_user_by_email(db, email=user_in.email)
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )
    return crud_user.create_user(db=db, obj_in=user_in)

# ---------------------------------------------------------
# 🔍 ENDPOINT: LISTAR USUÁRIOS (SOMENTE ADMIN)
# ---------------------------------------------------------
@router.get("/", response_model=List[UserResponse])
def read_users(
    tenant_id: UUID, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin) # 👈 Bloqueado para ADMIN
):
    """
    Retorna a lista de usuários pertencentes a um Tenant específico.
    Acesso restrito a usuários com papel de ADMIN.
    """
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para listar dados de outra clínica."
        )

    users = crud_user.get_users_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)
    return users

# ---------------------------------------------------------
# 🔍 ENDPOINT: BUSCAR UM USUÁRIO ESPECÍFICO (SOMENTE ADMIN)
# ---------------------------------------------------------
@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: UUID, 
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin) # 👈 Bloqueado para ADMIN
):
    """
    Busca os detalhes de um usuário específico.
    Acesso restrito a usuários com papel de ADMIN.
    """
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
# 🔄 ENDPOINT: ATUALIZAR USUÁRIO (SOMENTE ADMIN)
# ---------------------------------------------------------
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID, 
    tenant_id: UUID, 
    user_in: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin) # 👈 Bloqueado para ADMIN
):
    """
    Atualiza os dados de um usuário existente.
    Acesso restrito a usuários com papel de ADMIN.
    """
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
