from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse
from src.crud import service as crud_service
from src.api.deps import get_current_user
from src.models.user import User

router = APIRouter(
    prefix="/services",
    tags=["Catálogo de Serviços"]
)

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(service_in.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para cadastrar serviços em outra clínica."
        )
    return crud_service.create_service(db=db, obj_in=service_in, current_user_name=current_user.nome)

@router.get("/", response_model=List[ServiceResponse])
def read_services(
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    return crud_service.get_services_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)

@router.get("/{service_id}", response_model=ServiceResponse)
def read_service(
    service_id: UUID,
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    service = crud_service.get_service_by_id(db=db, service_id=service_id, tenant_id=tenant_id)
    if not service: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado.")
    return service

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: UUID,
    tenant_id: UUID,
    service_in: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    service = crud_service.get_service_by_id(db=db, service_id=service_id, tenant_id=tenant_id)
    if not service: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado.")
    return crud_service.update_service(db=db, db_service=service, obj_in=service_in, current_user_name=current_user.nome)
