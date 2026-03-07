import uuid
import calendar
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import List

from src.models.appointment import Appointment, AppointmentStatus
from src.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    RecorrenciaRegraInput,
    ProjecaoItem,
    FrequenciaRecorrencia,
    RecorrenciaCreateBatch
)

def create_appointment(db: Session, obj_in: AppointmentCreate, current_user_id: uuid.UUID) -> Appointment:
    db_obj = Appointment(**obj_in.model_dump(exclude_unset=True))
    db_obj.criado_por = current_user_id
    db_obj.alterado_por = current_user_id
    db_obj.alterado_em = datetime.utcnow() # Blindagem da Data
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_appointment_by_id(db: Session, appointment_id: uuid.UUID, tenant_id: uuid.UUID) -> Appointment | None:
    return db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == tenant_id,
        Appointment.deletado_em == None
    ).first()

def get_appointments_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
    return db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.deletado_em == None
    ).order_by(Appointment.data_hora_inicio.desc()).offset(skip).limit(limit).all()

def get_appointments_by_professional(db: Session, professional_id: uuid.UUID, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
    return db.query(Appointment).filter(
        Appointment.profissional_id == professional_id,
        Appointment.tenant_id == tenant_id,
        Appointment.deletado_em == None
    ).order_by(Appointment.data_hora_inicio.asc()).offset(skip).limit(limit).all()

def update_appointment(db: Session, db_appointment: Appointment, obj_in: AppointmentUpdate, current_user_id: uuid.UUID) -> Appointment:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_appointment, field, value)
        
    db_appointment.alterado_por = current_user_id
    db_appointment.alterado_em = datetime.utcnow() # Blindagem da Data
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def add_months(sourcedate: datetime, months: int) -> datetime:
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return sourcedate.replace(year=year, month=month, day=day)

def is_time_slot_available(db: Session, profissional_id: uuid.UUID, tenant_id: uuid.UUID, start_dt: datetime, end_dt: datetime) -> bool:
    conflito = db.query(Appointment).filter(
        Appointment.profissional_id == profissional_id,
        Appointment.tenant_id == tenant_id,
        Appointment.deletado_em == None,
        Appointment.status.notin_([
            AppointmentStatus.CANCELADO_CLIENTE,
            AppointmentStatus.CANCELADO_PROFISSIONAL,
            AppointmentStatus.NO_SHOW
        ]),
        Appointment.data_hora_inicio < end_dt,
        Appointment.data_hora_fim > start_dt
    ).first()
    return conflito is None

def gerar_projecao_recorrencia(db: Session, regra: RecorrenciaRegraInput) -> List[ProjecaoItem]:
    projecao = []
    current_start = regra.data_hora_inicio_base
    current_end = regra.data_hora_fim_base
    for i in range(regra.quantidade_sessoes):
        disponivel = is_time_slot_available(
            db=db,
            profissional_id=regra.profissional_id,
            tenant_id=regra.tenant_id,
            start_dt=current_start,
            end_dt=current_end
        )
        item = ProjecaoItem(
            indice=i + 1,
            data_hora_inicio=current_start,
            data_hora_fim=current_end,
            disponivel=disponivel,
            conflito_detalhe="Horário ocupado." if not disponivel else None
        )
        projecao.append(item)
        if regra.frequencia == FrequenciaRecorrencia.DIARIA:
            current_start += timedelta(days=1)
            current_end += timedelta(days=1)
        elif regra.frequencia == FrequenciaRecorrencia.SEMANAL:
            current_start += timedelta(weeks=1)
            current_end += timedelta(weeks=1)
        elif regra.frequencia == FrequenciaRecorrencia.QUINZENAL:
            current_start += timedelta(weeks=2)
            current_end += timedelta(weeks=2)
        elif regra.frequencia == FrequenciaRecorrencia.MENSAL:
            current_start = add_months(current_start, 1)
            current_end = add_months(current_end, 1)

    return projecao

def create_agendamentos_em_lote(db: Session, batch_in: RecorrenciaCreateBatch, current_user_id: uuid.UUID) -> List[Appointment]:
    grupo_id = uuid.uuid4()
    db_objs = []
    now = datetime.utcnow()
    for agendamento_in in batch_in.agendamentos:
        db_obj = Appointment(**agendamento_in.model_dump(exclude_unset=True))
        db_obj.grupo_recorrencia_id = grupo_id
        db_obj.criado_por = current_user_id
        db_obj.alterado_por = current_user_id
        
        # CORREÇÃO AQUI: Forçando a data de alteração no Python para o Banco não recusar
        db_obj.criado_em = now
        db_obj.alterado_em = now
        
        db.add(db_obj)
        db_objs.append(db_obj)
    db.commit()
    for obj in db_objs:
        db.refresh(obj)
    return db_objs
