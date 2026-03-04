from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Optional

from src.models.service_record import ServiceRecord
from src.schemas.service_record import ServiceRecordCreate, ServiceRecordUpdate

def create_service_record(db: Session, obj_in: ServiceRecordCreate) -> ServiceRecord:
    """Cria um novo registro de serviço/ficha."""
    db_obj = ServiceRecord(
        tenant_id=obj_in.tenant_id,
        customer_id=obj_in.customer_id,
        profissional_id=obj_in.profissional_id,
        appointment_id=obj_in.appointment_id,
        tipo=obj_in.tipo,
        conteudo=obj_in.conteudo
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_records_by_customer(db: Session, tenant_id: UUID, customer_id: UUID) -> List[ServiceRecord]:
    """Recupera todo o histórico de um cliente/paciente específico."""
    return db.query(ServiceRecord).filter(
        ServiceRecord.tenant_id == tenant_id,
        ServiceRecord.customer_id == customer_id
    ).order_by(ServiceRecord.criado_em.desc()).all()

def get_record_by_id(db: Session, record_id: UUID, tenant_id: UUID) -> Optional[ServiceRecord]:
    """Busca uma ficha específica por ID, garantindo o isolamento do tenant."""
    return db.query(ServiceRecord).filter(
        ServiceRecord.id == record_id,
        ServiceRecord.tenant_id == tenant_id
    ).first()

def update_service_record(db: Session, db_obj: ServiceRecord, obj_in: ServiceRecordUpdate) -> ServiceRecord:
    """Atualiza a ficha. Se for assinada agora, registra o timestamp."""
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # Se a ficha já está assinada, impedimos a edição do conteúdo
    if db_obj.assinado and "conteudo" in update_data:
        del update_data["conteudo"]
        
    # Se o status 'assinado' está mudando para True, setamos a data atual
    if update_data.get("assinado") is True and not db_obj.assinado:
        db_obj.data_assinatura = datetime.utcnow()

    for field in update_data:
        setattr(db_obj, field, update_data[field])

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
