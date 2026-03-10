from sqlalchemy.orm import Session, aliased
from uuid import UUID
from datetime import datetime

from src.models.tenant import Tenant, TenantStatus
from src.schemas.tenant import TenantCreate, TenantUpdate
from src.models.super_admin import SuperAdmin  # NOVO: Importando a tabela de admins

def get_tenant(db: Session, tenant_id: UUID):
    return db.query(Tenant).filter(Tenant.id == tenant_id).first()

def get_tenant_by_cnpj(db: Session, cnpj: str):
    return db.query(Tenant).filter(Tenant.cnpj == cnpj).first()

def get_tenant_by_dominio(db: Session, dominio_interno: str):
    return db.query(Tenant).filter(Tenant.dominio_interno == dominio_interno).first()

def get_tenants(db: Session, skip: int = 0, limit: int = 100):
    # Criamos 3 "apelidos" (aliases) para a tabela de SuperAdmin, pois precisamos fazer JOIN 3 vezes
    Criador = aliased(SuperAdmin)
    Alterador = aliased(SuperAdmin)
    Deletador = aliased(SuperAdmin)

    registros = db.query(
        Tenant,
        Criador.nome.label("criado_por_nome"),
        Alterador.nome.label("alterado_por_nome"),
        Deletador.nome.label("deletado_por_nome")
    ).outerjoin(Criador, Tenant.criado_por == Criador.id) \
     .outerjoin(Alterador, Tenant.alterado_por == Alterador.id) \
     .outerjoin(Deletador, Tenant.deletado_por == Deletador.id) \
     .order_by(Tenant.codigo_visual.asc()).offset(skip).limit(limit).all()

    # Acoplamos os nomes no objeto tenant para que o Pydantic consiga lê-los sem quebrar
    resultado = []
    for tenant, criado_nome, alterado_nome, deletado_nome in registros:
        tenant.criado_por_nome = criado_nome
        tenant.alterado_por_nome = alterado_nome
        tenant.deletado_por_nome = deletado_nome
        resultado.append(tenant)

    return resultado

def create_tenant(db: Session, tenant: TenantCreate, current_user_id: UUID):
    db_tenant = Tenant(**tenant.model_dump())
    db_tenant.criado_por = current_user_id
    db_tenant.alterado_por = current_user_id
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_tenant(db: Session, db_tenant: Tenant, tenant_update: TenantUpdate, current_user_id: UUID):
    update_data = tenant_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_tenant, key, value)
        
    db_tenant.alterado_por = current_user_id

    # Lógica Automática de Soft Delete
    if "status" in update_data and update_data["status"] == TenantStatus.INATIVO:
        db_tenant.deletado_em = datetime.utcnow()
        db_tenant.deletado_por = current_user_id
    elif "status" in update_data and update_data["status"] != TenantStatus.INATIVO:
        db_tenant.deletado_em = None
        db_tenant.deletado_por = None

    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def delete_tenant(db: Session, db_tenant: Tenant, current_user_id: UUID):
    db_tenant.deletado_em = datetime.utcnow()
    db_tenant.deletado_por = current_user_id
    db_tenant.status = TenantStatus.INATIVO
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant
