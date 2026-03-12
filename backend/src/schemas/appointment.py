from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from enum import Enum

class FrequenciaRecorrencia(str, Enum):
    DIARIA = "DIARIA"
    SEMANAL = "SEMANAL"
    QUINZENAL = "QUINZENAL"
    MENSAL = "MENSAL"

class AppointmentBase(BaseModel):
    customer_id: UUID
    professional_id: UUID
    servico_id: UUID 
    data_hora_inicio: datetime
    data_hora_fim: datetime
    status: Optional[str] = "PENDENTE" # CORREÇÃO AQUI
    observacoes_internas: Optional[str] = None
    grupo_recorrencia_id: Optional[UUID] = None
    
    metodo_pagamento_previsto: Optional[str] = None
    convenio_id: Optional[UUID] = None
    valor_base_servico: Optional[Decimal] = 0.00
    desconto_manual: Optional[Decimal] = 0.00
    acrescimo_manual: Optional[Decimal] = 0.00
    taxa_operadora_aplicada: Optional[Decimal] = 0.00
    valor_total_previsto: Optional[Decimal] = 0.00
    faturado: Optional[bool] = False

class AppointmentCreate(AppointmentBase):
    tenant_id: UUID

class AppointmentUpdate(BaseModel):
    data_hora_inicio: Optional[datetime] = None
    data_hora_fim: Optional[datetime] = None
    status: Optional[str] = None
    observacoes_internas: Optional[str] = None
    metodo_pagamento_previsto: Optional[str] = None
    convenio_id: Optional[UUID] = None
    valor_base_servico: Optional[Decimal] = None
    desconto_manual: Optional[Decimal] = None
    acrescimo_manual: Optional[Decimal] = None
    taxa_operadora_aplicada: Optional[Decimal] = None
    valor_total_previsto: Optional[Decimal] = None
    faturado: Optional[bool] = None

class AppointmentResponse(AppointmentBase):
    id: UUID
    tenant_id: UUID
    class Config:
        from_attributes = True

class RecorrenciaRegraInput(BaseModel):
    tenant_id: UUID
    customer_id: UUID
    professional_id: UUID
    servico_id: UUID
    data_hora_inicio_base: datetime
    data_hora_fim_base: datetime
    frequencia: FrequenciaRecorrencia
    quantidade_sessoes: int

class ProjecaoItem(BaseModel):
    indice: int
    data_hora_inicio: datetime
    data_hora_fim: datetime
    disponivel: bool
    conflito_detalhe: Optional[str] = None

class RecorrenciaProjecaoResponse(BaseModel):
    quantidade_solicitada: int
    quantidade_disponivel: int
    sessoes: List[ProjecaoItem]

class RecorrenciaCreateBatch(BaseModel):
    agendamentos: List[AppointmentCreate]
