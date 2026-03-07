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

# =========================================================
# FUNÇÕES ORIGINAIS (MANTIDAS INTACTAS)
# =========================================================

def create_appointment(db: Session, obj_in: AppointmentCreate) -> Appointment:
    """
    Salva um novo agendamento no banco de dados.
    """
    db_obj = Appointment(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_appointment_by_id(db: Session, appointment_id: uuid.UUID, tenant_id: uuid.UUID) -> Appointment | None:
    """
    Busca um agendamento específico, garantindo que pertence à clínica correta.
    """
    return db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == tenant_id
    ).first()

def get_appointments_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
    """
    Lista todos os agendamentos da clínica. 
    (No futuro, adicionaremos filtros por data aqui).
    """
    return db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id
    ).order_by(Appointment.data_hora_inicio.desc()).offset(skip).limit(limit).all()

def get_appointments_by_professional(db: Session, professional_id: uuid.UUID, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
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

# =========================================================
# NOVAS FUNÇÕES: LÓGICA AVANÇADA DE RECORRÊNCIA
# =========================================================

def add_months(sourcedate: datetime, months: int) -> datetime:
    """Função auxiliar para somar meses mantendo os dias corretos no calendário."""
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return sourcedate.replace(year=year, month=month, day=day)

def is_time_slot_available(db: Session, profissional_id: uuid.UUID, tenant_id: uuid.UUID, start_dt: datetime, end_dt: datetime) -> bool:
    """
    Verifica se o profissional está livre no período solicitado.
    Ignora agendamentos que já foram cancelados.
    """
    conflito = db.query(Appointment).filter(
        Appointment.profissional_id == profissional_id,
        Appointment.tenant_id == tenant_id,
        Appointment.status.notin_([
            AppointmentStatus.CANCELADO_CLIENTE,
            AppointmentStatus.CANCELADO_PROFISSIONAL,
            AppointmentStatus.NO_SHOW
        ]),
        Appointment.data_hora_inicio < end_dt, # Início do evento gravado é antes do fim do novo evento
        Appointment.data_hora_fim > start_dt   # Fim do evento gravado é depois do início do novo evento
    ).first()
    
    return conflito is None

def gerar_projecao_recorrencia(db: Session, regra: RecorrenciaRegraInput) -> List[ProjecaoItem]:
    """
    Calcula as datas futuras e verifica a disponibilidade para cada uma (Geração do Rascunho).
    """
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
            conflito_detalhe="Horário ocupado pelo profissional." if not disponivel else None
        )
        projecao.append(item)
        
        # Incrementa para a próxima sessão com base na frequência
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

def create_agendamentos_em_lote(db: Session, batch_in: RecorrenciaCreateBatch) -> List[Appointment]:
    """
    Salva a lista final aprovada pelo usuário.
    Tudo é salvo na mesma transação e ganha o mesmo grupo_recorrencia_id.
    """
    # 1. Geramos a "etiqueta" invisível que unirá todos esses agendamentos
    grupo_id = uuid.uuid4()
    
    db_objs = []
    for agendamento_in in batch_in.agendamentos:
        db_obj = Appointment(**agendamento_in.model_dump())
        db_obj.grupo_recorrencia_id = grupo_id
        db.add(db_obj)
        db_objs.append(db_obj)
    
    # 2. Comita todos de uma vez (Se o banco der erro em um, cancela todos automaticamente)
    db.commit()
    
    # 3. Atualiza os objetos com os IDs que o banco acabou de criar
    for obj in db_objs:
        db.refresh(obj)
        
    return db_objs

