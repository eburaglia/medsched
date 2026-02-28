from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from src.crud import resource as crud_resource
from src.api.deps import get_current_user
from src.models.user import User

# ---------------------------------------------------------
# 🚦 CONFIGURAÇÃO DO ROTEADOR
# ---------------------------------------------------------
router = APIRouter(
    prefix="/resources",
    tags=["Recursos (Salas e Equipamentos)"]
)

# ---------------------------------------------------------
# ✍ ENDPOINT: CRIAR RECURSO
# ---------------------------------------------------------
@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    resource_in: ResourceCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adiciona um novo recurso (ex: Sala de Pilates, Máquina de Laser) ao sistema.
    """
    if str(current_user.tenant_id) != str(resource_in.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para cadastrar recursos em outra clínica."
        )

    return crud_resource.create_resource(db=db, obj_in=resource_in)

# ---------------------------------------------------------
# 🔍 ENDPOINT: LISTAR RECURSOS
# ---------------------------------------------------------
@router.get("/", response_model=List[ResourceResponse])
def read_resources(
    tenant_id: UUID, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o catálogo completo de salas e equipamentos da clínica.
    """
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar os recursos de outra clínica."
        )

    resources = crud_resource.get_resources_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)
    return resources

# ---------------------------------------------------------
# 🔍 ENDPOINT: BUSCAR UM RECURSO ESPECÍFICO
# ---------------------------------------------------------
@router.get("/{resource_id}", response_model=ResourceResponse)
def read_resource(
    resource_id: UUID, 
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca os detalhes de um recurso específico pelo ID.
    """
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar os dados de outra clínica."
        )

    resource = crud_resource.get_resource_by_id(db=db, resource_id=resource_id, tenant_id=tenant_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso não encontrado."
        )
    return resource

# ---------------------------------------------------------
# 🔄 ENDPOINT: ATUALIZAR RECURSO
# ---------------------------------------------------------
@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: UUID, 
    tenant_id: UUID, 
    resource_in: ResourceUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza as informações de um recurso (Ex: colocar em manutenção).
    """
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar os dados de outra clínica."
        )

    resource = crud_resource.get_resource_by_id(db=db, resource_id=resource_id, tenant_id=tenant_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso não encontrado."
        )
    
    return crud_resource.update_resource(db=db, db_resource=resource, obj_in=resource_in)
