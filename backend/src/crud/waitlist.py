from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Optional

from src.models.waitlist import Waitlist
from src.schemas.waitlist import WaitlistCreate, WaitlistUpdate

def create_waitlist_entry(db: Session, entry: WaitlistCreate, current_user_id: UUID) -> Waitlist:
    db_entry = Waitlist(
        tenant_id=entry.tenant_id,
        customer_id=entry.customer_id,
        servico_id=entry.servico_id,
        professional_id=entry.professional_id,
        data_hora_inicio_desejada=entry.data_hora_inicio_desejada,
        data_hora_fim_desejada=entry.data_hora_fim_desejada,
        status=entry.status or "AGUARDANDO",
        observacoes=entry.observacoes,
        criado_por=current_user_id,
        alterado_por=current_user_id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_waitlist_entries(
    db: Session, 
    tenant_id: UUID, 
    status: Optional[str] = None, 
    professional_id: Optional[UUID] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[Waitlist]:
    query = db.query(Waitlist).filter(Waitlist.tenant_id == tenant_id)
    
    if status:
        query = query.filter(Waitlist.status == status)
    if professional_id:
        query = query.filter(Waitlist.professional_id == professional_id)
        
    # Ordena pelos mais antigos primeiro (quem chegou primeiro na fila tem prioridade)
    return query.order_by(Waitlist.criado_em.asc()).offset(skip).limit(limit).all()

def get_waitlist_entry(db: Session, entry_id: UUID, tenant_id: UUID) -> Optional[Waitlist]:
    return db.query(Waitlist).filter(
        Waitlist.id == entry_id, 
        Waitlist.tenant_id == tenant_id
    ).first()

def update_waitlist_entry(db: Session, db_entry: Waitlist, update_data: WaitlistUpdate, current_user_id: UUID) -> Waitlist:
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for key, value in update_dict.items():
        setattr(db_entry, key, value)
        
    db_entry.alterado_por = current_user_id
    db_entry.alterado_em = datetime.utcnow()
    
    db.commit()
    db.refresh(db_entry)
    return db_entry
