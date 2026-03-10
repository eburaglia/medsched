from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas import tenant as schemas
from src.crud import tenant as crud
from src.api.deps import get_current_user, RoleChecker
from src.models.user import User

router = APIRouter()

# ------------------------------------------------------------------
# RBAC (Role-Based Access Control)
# ------------------------------------------------------------------
require_super_admin = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN"])
require_leitura_tenant = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR", "PROFISSIONAL"])

@router.post("/", response_model=schemas.TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(
    tenant: schemas.TenantCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    # Proteção de duplicidade: O CRUD usa get_tenant_by_cnpj
    if hasattr(tenant, 'cnpj') and tenant.cnpj:
        db_tenant = crud.get_tenant_by_cnpj(db, cnpj=tenant.cnpj)
        if db_tenant:
            raise HTTPException(status_code=400, detail="Clínica/Empresa já registrada com este CNPJ.")
            
    # CRÍTICO: Passando o ID do Super Admin para a Auditoria do CRUD
    return crud.create_tenant(db=db, tenant=tenant, current_user_id=current_user.id)


@router.get("/", response_model=List[schemas.TenantResponse])
def read_tenants(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    return crud.get_tenants(db, skip=skip, limit=limit)


@router.get("/{tenant_id}", response_model=schemas.TenantResponse)
def read_tenant(
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_leitura_tenant)
):
    papel = current_user.papel.value if hasattr(current_user.papel, 'value') else current_user.papel
    if papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        if current_user.tenant_id != tenant_id:
            raise HTTPException(status_code=403, detail="Acesso negado. Você não pertence a esta clínica.")

    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
    return db_tenant


@router.put("/{tenant_id}", response_model=schemas.TenantResponse)
def update_tenant(
    tenant_id: UUID, 
    tenant: schemas.TenantUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
        
    # CRÍTICO: Passando o db_tenant (objeto) e o current_user_id que o CRUD exige
    return crud.update_tenant(db=db, db_tenant=db_tenant, tenant_update=tenant, current_user_id=current_user.id)


@router.delete("/{tenant_id}", response_model=schemas.TenantResponse)
def delete_tenant(
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
        
    # CRÍTICO: Passando o db_tenant (objeto) e o current_user_id que o CRUD exige
    return crud.delete_tenant(db=db, db_tenant=db_tenant, current_user_id=current_user.id)
