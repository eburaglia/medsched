from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from src.models.appointment import AppointmentStatus

# 1. Base: Campos comuns a todos os agendamentos
class AppointmentBase(BaseModel):
    customer_id: UUID = Field(..., description="ID do cliente/paciente (Tabela customers)")
    profissional_id: UUID = Field(..., description="ID do profissional (Tabela users)")
    
    # IDs opcionais temporariamente até criarmos os módulos de Serviços e Recursos
    servico_id: Optional[UUID] = None
    recurso_id: Optional[UUID] = None
    
    data_hora_inicio: datetime = Field(..., description="Data e hora de início (ISO 8601)")
    data_hora_fim: datetime = Field(..., description="Data e hora de término (ISO 8601)")
    
    # A Fotografia do Agendamento
    duracao_aplicada: Optional[int] = Field(None, description="Duração do serviço em minutos no momento do agendamento")
    preco_aplicado: Optional[Decimal] = Field(None, description="Preço do serviço no momento do agendamento")
    grupo_recorrencia_id: Optional[UUID] = None
    
    observacoes_cliente: Optional[str] = Field(None, description="Observações feitas pelo cliente")
    observacoes_internas: Optional[str] = Field(None, description="Anotações internas da clínica")
    
    # A trava de segurança do sistema
    tenant_id: UUID = Field(..., description="ID da clínica (Tenant)")

# 2. Formulário de Criação (Herda a Base e define o status inicial)
class AppointmentCreate(AppointmentBase):
    status: Optional[AppointmentStatus] = Field(default=AppointmentStatus.PENDENTE)

# 3. Formulário de Atualização (Todos os campos são opcionais)
class AppointmentUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    profissional_id: Optional[UUID] = None
    servico_id: Optional[UUID] = None
    recurso_id: Optional[UUID] = None
    status: Optional[AppointmentStatus] = None
    data_hora_inicio: Optional[datetime] = None
    data_hora_fim: Optional[datetime] = None
    duracao_aplicada: Optional[int] = None
    preco_aplicado: Optional[Decimal] = None
    observacoes_cliente: Optional[str] = None
    observacoes_internas: Optional[str] = None

# 4. Formato de Resposta (O que a API devolve para o Frontend/Swagger)
class AppointmentResponse(AppointmentBase):
    id: UUID
    status: AppointmentStatus
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(from_attributes=True)
