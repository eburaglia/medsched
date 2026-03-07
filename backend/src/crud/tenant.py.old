from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from src.models.tenant import Tenant
from src.schemas.tenant import TenantCreate, TenantUpdate

def get_tenant(db: Session, tenant_id: UUID):
    """Busca uma clínica pelo ID, desde que não esteja deletada."""
    return db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.deletado_em == None).first()

def get_tenant_by_cnpj(db: Session, cnpj: str):
    """Verifica se um CNPJ já está cadastrado."""
    return db.query(Tenant).filter(Tenant.cnpj == cnpj, Tenant.deletado_em == None).first()

def get_tenant_by_dominio(db: Session, dominio_interno: str):
    """Verifica se um domínio interno (ex: clinica-vida) já está em uso."""
    return db.query(Tenant).filter(Tenant.dominio_interno == dominio_interno, Tenant.deletado_em == None).first()

def get_tenants(db: Session, skip: int = 0, limit: int = 100):
    """Lista todas as clínicas ativas no sistema com paginação."""
    return db.query(Tenant).filter(Tenant.deletado_em == None).offset(skip).limit(limit).all()

def create_tenant(db: Session, tenant: TenantCreate):
    """Pega os dados validados do Pydantic e salva no PostgreSQL."""
    # Transforma o Schema do Pydantic em um Modelo do SQLAlchemy
    db_tenant = Tenant(**tenant.model_dump())
    
    db.add(db_tenant)
    db.commit() # Efetiva a gravação física no banco
    db.refresh(db_tenant) # Atualiza a variável com o ID e Datas geradas pelo banco
    
    return db_tenant

def update_tenant(db: Session, db_tenant: Tenant, tenant_update: TenantUpdate):
    """Atualiza apenas os campos que foram enviados na requisição."""
    # Pega apenas os dados que o cliente realmente enviou (exclude_unset=True)
    update_data = tenant_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_tenant, key, value)
        
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def delete_tenant(db: Session, db_tenant: Tenant, admin_id: UUID = None):
    """Soft Delete: Carimba a data de exclusão em vez de apagar o registro."""
    db_tenant.deletado_em = datetime.utcnow()
    
    if admin_id:
        db_tenant.deletado_por = admin_id
        
    db.commit()
    db.refresh(db_tenant)
    return db_tenant
