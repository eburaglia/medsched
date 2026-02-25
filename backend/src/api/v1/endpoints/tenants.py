from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas import tenant as schemas
from src.crud import tenant as crud

# Cria o roteador para a entidade Tenant
router = APIRouter()

@router.post("/", response_model=schemas.TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(tenant_in: schemas.TenantCreate, db: Session = Depends(get_db)):
    """Cadastra uma nova clínica no sistema."""
    # 1. Regra de Negócio: Verifica se o CNPJ já existe
    if tenant_in.cnpj:
        db_tenant_cnpj = crud.get_tenant_by_cnpj(db, cnpj=tenant_in.cnpj)
        if db_tenant_cnpj:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado no sistema.")
            
    # 2. Regra de Negócio: Verifica se a URL personalizada já está em uso
    db_tenant_dominio = crud.get_tenant_by_dominio(db, dominio_interno=tenant_in.dominio_interno)
    if db_tenant_dominio:
        raise HTTPException(status_code=400, detail="Este domínio interno já está em uso por outra clínica.")
        
    # 3. Passa pelo Operário (CRUD) e salva no banco
    return crud.create_tenant(db=db, tenant=tenant_in)


@router.get("/", response_model=List[schemas.TenantResponse])
def read_tenants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todas as clínicas cadastradas (com paginação)."""
    return crud.get_tenants(db, skip=skip, limit=limit)


@router.get("/{tenant_id}", response_model=schemas.TenantResponse)
def read_tenant(tenant_id: UUID, db: Session = Depends(get_db)):
    """Busca os detalhes de uma clínica específica pelo seu ID."""
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada ou inativa.")
    return db_tenant


@router.put("/{tenant_id}", response_model=schemas.TenantResponse)
def update_tenant(tenant_id: UUID, tenant_in: schemas.TenantUpdate, db: Session = Depends(get_db)):
    """Atualiza os dados de uma clínica."""
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
        
    return crud.update_tenant(db=db, db_tenant=db_tenant, tenant_update=tenant_in)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(tenant_id: UUID, db: Session = Depends(get_db)):
    """Remove uma clínica do sistema (Soft Delete)."""
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
        
    crud.delete_tenant(db=db, db_tenant=db_tenant)
    return None # HTTP 204 não devolve corpo na resposta
