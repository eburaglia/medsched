from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from src.models.service import Service, ServiceStatus
from src.schemas.service import ServiceCreate, ServiceUpdate

def create_service(db: Session, obj_in: ServiceCreate) -> Service:
    """
    Cadastra um novo serviço no catálogo da clínica.
    """
    db_obj = Service(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_service_by_id(db: Session, service_id: UUID, tenant_id: UUID) -> Service | None:
    """
    Busca um serviço específico garantindo o isolamento do tenant.
    """
    return db.query(Service).filter(
        Service.id == service_id,
        Service.tenant_id == tenant_id
    ).first()

def get_services_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[Service]:
    """
    Lista os serviços da clínica, ordenados alfabeticamente.
    """
    return db.query(Service).filter(
        Service.tenant_id == tenant_id
    ).order_by(Service.nome.asc()).offset(skip).limit(limit).all()

def update_service(db: Session, db_service: Service, obj_in: ServiceUpdate) -> Service:
    """
    Atualiza dados do serviço (ex: aumentar o preço, mudar o status para INATIVO).
    """
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_service, field, value)
        
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    
    return db_service
