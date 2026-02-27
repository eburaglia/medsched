from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from src.models.appointment import Appointment
from src.schemas.appointment import AppointmentCreate, AppointmentUpdate

def create_appointment(db: Session, obj_in: AppointmentCreate) -> Appointment:
    """
    Salva um novo agendamento no banco de dados.
    """
    db_obj = Appointment(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_appointment_by_id(db: Session, appointment_id: UUID, tenant_id: UUID) -> Appointment | None:
    """
    Busca um agendamento específico, garantindo que pertence à clínica correta.
    """
    return db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == tenant_id
    ).first()

def get_appointments_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
    """
    Lista todos os agendamentos da clínica. 
    (No futuro, adicionaremos filtros por data aqui).
    """
    return db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id
    ).order_by(Appointment.data_hora_inicio.desc()).offset(skip).limit(limit).all()

def get_appointments_by_professional(db: Session, professional_id: UUID, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
    """
    Lista apenas os agendamentos de um profissional específico (ex: A agenda da Dra. Maria).
    """
    return db.query(Appointment).filter(
        Appointment.profissional_id == professional_id,
        Appointment.tenant_id == tenant_id
    ).order_by(Appointment.data_hora_inicio.asc()).offset(skip).limit(limit).all()

def update_appointment(db: Session, db_appointment: Appointment, obj_in: AppointmentUpdate) -> Appointment:
    """
    Atualiza dados de um agendamento existente (ex: mudar o status para CONCLUIDO ou remarcar data).
    """
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_appointment, field, value)
        
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    return db_appointment
