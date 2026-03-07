from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas import tenant as schemas
from src.crud import tenant as crud
from src.api.deps import get_current_user
from src.models.user import User

router = APIRouter()

def verify_system_admin(current_user: User):
    if current_user.papel not in ['SYSTEM_ADMIN', 'SUPER_ADMIN']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso restrito. Apenas Administradores de Sistema podem gerenciar Tenants."
        )

@router.post("/", response_model=schemas.TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(
    tenant_in: schemas.TenantCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_system_admin(current_user)

    if tenant_in.cnpj:
        db_tenant_cnpj = crud.get_tenant_by_cnpj(db, cnpj=tenant_in.cnpj)
        if db_tenant_cnpj:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado no sistema.")
            
    if tenant_in.dominio_interno:
        db_tenant_dominio = crud.get_tenant_by_dominio(db, dominio_interno=tenant_in.dominio_interno)
        if db_tenant_dominio:
            raise HTTPException(status_code=400, detail="Este domínio interno já está em uso por outra clínica.")
            
    return crud.create_tenant(db=db, tenant=tenant_in, current_user_id=current_user.id)


@router.get("/", response_model=List[schemas.TenantResponse])
def read_tenants(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_system_admin(current_user)
    return crud.get_tenants(db, skip=skip, limit=limit)


@router.get("/{tenant_id}", response_model=schemas.TenantResponse)
def read_tenant(
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_system_admin(current_user)
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
    return db_tenant


@router.put("/{tenant_id}", response_model=schemas.TenantResponse)
def update_tenant(
    tenant_id: UUID, 
    tenant_in: schemas.TenantUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_system_admin(current_user)
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
        
    if tenant_in.cnpj and tenant_in.cnpj != db_tenant.cnpj:
        if crud.get_tenant_by_cnpj(db, cnpj=tenant_in.cnpj):
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado no sistema.")
            
    if tenant_in.dominio_interno and tenant_in.dominio_interno != db_tenant.dominio_interno:
        if crud.get_tenant_by_dominio(db, dominio_interno=tenant_in.dominio_interno):
            raise HTTPException(status_code=400, detail="Domínio já em uso.")

    return crud.update_tenant(db=db, db_tenant=db_tenant, tenant_update=tenant_in, current_user_id=current_user.id)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_system_admin(current_user)
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
    crud.delete_tenant(db=db, db_tenant=db_tenant, current_user_id=current_user.id)
    return None
