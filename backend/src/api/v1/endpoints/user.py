from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

# Importamos a dependência do banco de dados (Ajuste o caminho se necessário)
from src.database import get_db

# Importamos nossos Schemas (Validação) e CRUD (Regra de negócio)
from src.schemas.user import UserCreate, UserUpdate, UserResponse
from src.crud import user as crud_user

# ---------------------------------------------------------
# 🚦 CONFIGURAÇÃO DO ROTEADOR
# ---------------------------------------------------------
router = APIRouter(
    prefix="/users",
    tags=["Usuários"]
)

# ---------------------------------------------------------
# ✍️ ENDPOINT: CRIAR USUÁRIO
# ---------------------------------------------------------
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Cria um novo usuário no sistema.
    A senha será automaticamente criptografada na camada de CRUD.
    """
    # Verifica se o e-mail já existe (Regra de Negócio Global)
    user_exists = crud_user.get_user_by_email(db, email=user_in.email)
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )
    
    # Se passou pela validação, cria o usuário
    return crud_user.create_user(db=db, obj_in=user_in)

# ---------------------------------------------------------
# 🔍 ENDPOINT: LISTAR USUÁRIOS (POR TENANT)
# ---------------------------------------------------------
@router.get("/", response_model=List[UserResponse])
def read_users(tenant_id: UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retorna a lista de usuários pertencentes a um Tenant específico.
    Obriga a passagem do tenant_id para garantir isolamento de dados.
    """
    users = crud_user.get_users_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)
    return users

# ---------------------------------------------------------
# 🔍 ENDPOINT: BUSCAR UM USUÁRIO ESPECÍFICO
# ---------------------------------------------------------
@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: UUID, tenant_id: UUID, db: Session = Depends(get_db)):
    """
    Busca os detalhes de um usuário específico.
    Garante que o usuário solicitado pertence ao tenant informado.
    """
    user = crud_user.get_user_by_id(db=db, user_id=user_id, tenant_id=tenant_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado ou não pertence a esta clínica."
        )
    return user

# ---------------------------------------------------------
# 🔄 ENDPOINT: ATUALIZAR USUÁRIO
# ---------------------------------------------------------
@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, tenant_id: UUID, user_in: UserUpdate, db: Session = Depends(get_db)):
    """
    Atualiza os dados de um usuário existente.
    """
    # 1. Verifica se o usuário existe e pertence ao tenant
    user = crud_user.get_user_by_id(db=db, user_id=user_id, tenant_id=tenant_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )
    
    # 2. Executa a atualização segura
    user_updated = crud_user.update_user(db=db, db_user=user, obj_in=user_in)
    return user_updated
