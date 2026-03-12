from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal

class AppointmentBase(BaseModel):
    customer_id: UUID
    service_id: UUID
    data_hora_inicio: datetime
    data_hora_fim: datetime
    status: Optional[str] = "agendado"
    observacoes: Optional[str] = None
    
    # Campos Financeiros (Opcionais na criação inicial)
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
    observacoes: Optional[str] = None
    
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
