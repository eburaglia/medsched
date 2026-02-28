from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from src.models.resource import Resource, ResourceStatus
from src.schemas.resource import ResourceCreate, ResourceUpdate

def create_resource(db: Session, obj_in: ResourceCreate) -> Resource:
    """
    Cadastra uma nova sala, equipamento ou ambiente online no sistema.
    """
    db_obj = Resource(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_resource_by_id(db: Session, resource_id: UUID, tenant_id: UUID) -> Resource | None:
    """
    Busca um recurso específico garantindo o isolamento do tenant.
    """
    return db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.tenant_id == tenant_id
    ).first()

def get_resources_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[Resource]:
    """
    Lista toda a infraestrutura disponível na clínica, em ordem alfabética.
    """
    return db.query(Resource).filter(
        Resource.tenant_id == tenant_id
    ).order_by(Resource.nome.asc()).offset(skip).limit(limit).all()

def update_resource(db: Session, db_resource: Resource, obj_in: ResourceUpdate) -> Resource:
    """
    Atualiza o status de um recurso (Ex: colocar um equipamento em MANUTENCAO).
    """
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_resource, field, value)
        
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    
    return db_resource
