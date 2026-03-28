from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    RecorrenciaRegraInput, RecorrenciaProjecaoResponse, RecorrenciaCreateBatch
)
from src.crud import appointment as crud_appointment
from src.api.deps import get_current_user
from src.models.user import User

# 👇 DRCODE: Importando o disparador de notificações
from src.utils.notification_trigger import NotificationTrigger

router = APIRouter(prefix="/appointments", tags=["Agendamentos (Consultas)"])

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_in: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(appointment_in.tenant_id) and current_user.papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão para criar agendamentos nesta clínica.")
    
    # Cria o agendamento
    new_app = crud_appointment.create_appointment(db=db, obj_in=appointment_in, current_user_id=current_user.id)
    
    # 👇 DRCODE: Dispara gatilho de Novo Agendamento
    try:
        NotificationTrigger.trigger_appointment_event(db, new_app.id, "new_appointment")
    except Exception as e:
        print(f"⚠️ Erro ao enfileirar notificação: {e}")
        
    return new_app

@router.post("/recorrencia/projecao", response_model=RecorrenciaProjecaoResponse)
def projetar_recorrencia(
    regra_in: RecorrenciaRegraInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(regra_in.tenant_id) and current_user.papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    sessoes_projetadas = crud_appointment.gerar_projecao_recorrencia(db=db, regra=regra_in)
    qtd_disponivel = sum(1 for s in sessoes_projetadas if s.disponivel)
    return RecorrenciaProjecaoResponse(quantidade_solicitada=regra_in.quantidade_sessoes, quantidade_disponivel=qtd_disponivel, sessoes=sessoes_projetadas)

@router.post("/recorrencia/lote", response_model=List[AppointmentResponse], status_code=status.HTTP_201_CREATED)
def criar_recorrencia_lote(
    batch_in: RecorrenciaCreateBatch, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    for agendamento in batch_in.agendamentos:
        if str(current_user.tenant_id) != str(agendamento.tenant_id) and current_user.papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
            raise HTTPException(status_code=403, detail="Sem permissão no lote.")
    
    apps = crud_appointment.create_agendamentos_em_lote(db=db, batch_in=batch_in, current_user_id=current_user.id)
    
    # 👇 DRCODE: Dispara notificação para cada item do lote
    for a in apps:
        try:
            NotificationTrigger.trigger_appointment_event(db, a.id, "new_appointment")
        except: pass
        
    return apps

@router.get("/agenda/me", response_model=List[AppointmentResponse])
def read_my_agenda(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud_appointment.get_appointments_by_professional(db=db, professional_id=current_user.id, tenant_id=current_user.tenant_id, skip=skip, limit=limit)

@router.get("/", response_model=List[AppointmentResponse])
def read_appointments(tenant_id: UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if str(current_user.tenant_id) != str(tenant_id) and current_user.papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    return crud_appointment.get_appointments_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def read_appointment(appointment_id: UUID, tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if str(current_user.tenant_id) != str(tenant_id) and current_user.papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    appointment = crud_appointment.get_appointment_by_id(db=db, appointment_id=appointment_id, tenant_id=tenant_id)
    if not appointment: raise HTTPException(status_code=404, detail="Não encontrado.")
    return appointment

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: UUID, tenant_id: UUID, appointment_in: AppointmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if str(current_user.tenant_id) != str(tenant_id) and current_user.papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    
    appointment = crud_appointment.get_appointment_by_id(db=db, appointment_id=appointment_id, tenant_id=tenant_id)
    if not appointment: raise HTTPException(status_code=404, detail="Não encontrado.")
    
    old_status = appointment.status
    updated_app = crud_appointment.update_appointment(db=db, db_appointment=appointment, obj_in=appointment_in, current_user_id=current_user.id)
    
    # 👇 DRCODE: Gatilhos baseados na mudança de status
    try:
        if old_status != updated_app.status:
            if updated_app.status == "confirmado":
                NotificationTrigger.trigger_appointment_event(db, updated_app.id, "appointment_confirmed")
            elif updated_app.status in ["cancelado_cliente", "cancelado_profissional"]:
                NotificationTrigger.trigger_appointment_event(db, updated_app.id, "appointment_canceled")
    except Exception as e:
        print(f"⚠️ Erro ao disparar evento de atualização: {e}")

    return updated_app
