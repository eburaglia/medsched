from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from datetime import datetime

from src.models.service import Service, ServiceStatus
from src.schemas.service import ServiceCreate, ServiceUpdate

def create_service(db: Session, obj_in: ServiceCreate, current_user_name: str) -> Service:
    db_obj = Service(**obj_in.model_dump())
    db_obj.criado_por = current_user_name
    db_obj.alterado_por = current_user_name
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_service_by_id(db: Session, service_id: UUID, tenant_id: UUID) -> Service | None:
    return db.query(Service).filter(
        Service.id == service_id,
        Service.tenant_id == tenant_id
    ).first()

def get_services_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[Service]:
    return db.query(Service).filter(
        Service.tenant_id == tenant_id
    ).order_by(Service.nome.asc()).offset(skip).limit(limit).all()

def update_service(db: Session, db_service: Service, obj_in: ServiceUpdate, current_user_name: str) -> Service:
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_service, field, value)
    
    db_service.alterado_por = current_user_name
    
    # Lógica de Soft Delete para Inativação
    if "status" in update_data and update_data["status"] == ServiceStatus.INATIVO:
        db_service.deletado_em = datetime.utcnow()
        db_service.deletado_por = current_user_name
    elif "status" in update_data and update_data["status"] == ServiceStatus.ATIVO:
        db_service.deletado_em = None
        db_service.deletado_por = None
        
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service
