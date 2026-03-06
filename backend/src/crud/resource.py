from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from datetime import datetime

from src.models.resource import Resource, ResourceStatus
from src.schemas.resource import ResourceCreate, ResourceUpdate

def create_resource(db: Session, obj_in: ResourceCreate, current_user_name: str) -> Resource:
    db_obj = Resource(**obj_in.model_dump())
    db_obj.criado_por = current_user_name
    db_obj.alterado_por = current_user_name
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_resource_by_id(db: Session, resource_id: UUID, tenant_id: UUID) -> Resource | None:
    return db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.tenant_id == tenant_id
    ).first()

def get_resources_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[Resource]:
    return db.query(Resource).filter(
        Resource.tenant_id == tenant_id
    ).order_by(Resource.nome.asc()).offset(skip).limit(limit).all()

def update_resource(db: Session, db_resource: Resource, obj_in: ResourceUpdate, current_user_name: str) -> Resource:
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_resource, field, value)
    
    db_resource.alterado_por = current_user_name
    
    # Lógica de Soft Delete
    if "status" in update_data and update_data["status"] == ResourceStatus.INATIVO:
        db_resource.deletado_em = datetime.utcnow()
        db_resource.deletado_por = current_user_name
    elif "status" in update_data and update_data["status"] == ResourceStatus.ATIVO:
        db_resource.deletado_em = None
        db_resource.deletado_por = None

    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource
