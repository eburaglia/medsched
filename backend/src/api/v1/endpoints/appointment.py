from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.appointment import (
    AppointmentCreate, 
    AppointmentUpdate, 
    AppointmentResponse,
    RecorrenciaRegraInput,
    RecorrenciaProjecaoResponse,
    RecorrenciaCreateBatch
)
from src.crud import appointment as crud_appointment
from src.api.deps import get_current_user
from src.models.user import User

# ---------------------------------------------------------
# 🚦 CONFIGURAÇÃO DO ROTEADOR
# ---------------------------------------------------------
router = APIRouter(
    prefix="/appointments",
    tags=["Agendamentos (Consultas)"]
)

# ---------------------------------------------------------
# ✍ ENDPOINT: CRIAR AGENDAMENTO SIMPLES
# ---------------------------------------------------------
@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_in: AppointmentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria um novo agendamento (consulta/sessão) único no sistema.
    """
    if str(current_user.tenant_id) != str(appointment_in.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para criar agendamentos em outra clínica."
        )

    # Aqui no futuro podemos adicionar validações de conflito de horário
    return crud_appointment.create_appointment(db=db, obj_in=appointment_in)

# =========================================================
# 🔄 ENDPOINTS: LÓGICA DE RECORRÊNCIA (DOIS PASSOS)
# =========================================================

# PASSO 1: O Rascunho (Não salva no banco)
@router.post("/recorrencia/projecao", response_model=RecorrenciaProjecaoResponse)
def projetar_recorrencia(
    regra_in: RecorrenciaRegraInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calcula datas futuras para sessões recorrentes e checa disponibilidade na agenda.
    Devolve um rascunho para o usuário aprovar antes de salvar.
    """
    if str(current_user.tenant_id) != str(regra_in.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para simular agendas em outra clínica."
        )

    sessoes_projetadas = crud_appointment.gerar_projecao_recorrencia(db=db, regra=regra_in)
    qtd_disponivel = sum(1 for s in sessoes_projetadas if s.disponivel)

    return RecorrenciaProjecaoResponse(
        quantidade_solicitada=regra_in.quantidade_sessoes,
        quantidade_disponivel=qtd_disponivel,
        sessoes=sessoes_projetadas
    )

# PASSO 2: A Efetivação (Salva o Lote aprovado)
@router.post("/recorrencia/lote", response_model=List[AppointmentResponse], status_code=status.HTTP_201_CREATED)
def criar_recorrencia_lote(
    batch_in: RecorrenciaCreateBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Salva uma lista final de agendamentos no banco de dados de uma só vez,
    agrupando-os sob o mesmo ID de recorrência para facilitar cancelamentos futuros.
    """
    # Validação de segurança dupla (garantir que ninguém injetou um tenant falso na lista)
    for agendamento in batch_in.agendamentos:
        if str(current_user.tenant_id) != str(agendamento.tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Um ou mais agendamentos pertencem a uma clínica não autorizada."
            )

    criados = crud_appointment.create_agendamentos_em_lote(db=db, batch_in=batch_in)
    return criados

# =========================================================
# 📅 ENDPOINTS DE BUSCA E ATUALIZAÇÃO
# =========================================================

@router.get("/agenda/me", response_model=List[AppointmentResponse])
def read_my_agenda(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna a agenda exclusiva do profissional que está logado.
    """
    appointments = crud_appointment.get_appointments_by_professional(
        db=db, 
        professional_id=current_user.id, 
        tenant_id=current_user.tenant_id, 
        skip=skip, 
        limit=limit
    )
    return appointments

@router.get("/", response_model=List[AppointmentResponse])
def read_appointments(
    tenant_id: UUID, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna todos os agendamentos da clínica.
    """
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar a agenda de outra clínica."
        )

    appointments = crud_appointment.get_appointments_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)
    return appointments

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def read_appointment(
    appointment_id: UUID, 
    tenant_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca os detalhes de um agendamento específico.
    """
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar os dados de outra clínica."
        )

    appointment = crud_appointment.get_appointment_by_id(db=db, appointment_id=appointment_id, tenant_id=tenant_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agendamento não encontrado."
        )
    return appointment

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: UUID, 
    tenant_id: UUID, 
    appointment_in: AppointmentUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza um agendamento (Ex: remarcar data, alterar status para CONCLUIDO).
    """
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar os dados de outra clínica."
        )

    appointment = crud_appointment.get_appointment_by_id(db=db, appointment_id=appointment_id, tenant_id=tenant_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agendamento não encontrado."
        )
    
    return crud_appointment.update_appointment(db=db, db_appointment=appointment, obj_in=appointment_in)
