import enum
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from src.models.appointment import AppointmentStatus

# ---------------------------------------------------------
# 1. Base: Campos comuns a todos os agendamentos
# ---------------------------------------------------------
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

# ---------------------------------------------------------
# 2. Formulário de Criação e Atualização
# ---------------------------------------------------------
class AppointmentCreate(AppointmentBase):
    status: Optional[AppointmentStatus] = Field(default=AppointmentStatus.PENDENTE)

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

# ---------------------------------------------------------
# 3. Formato de Resposta Padrão
# ---------------------------------------------------------
class AppointmentResponse(AppointmentBase):
    id: UUID
    status: AppointmentStatus
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(from_attributes=True)

# =========================================================
# NOVOS SCHEMAS: MÓDULO DE RECORRÊNCIA (LÓGICA AVANÇADA)
# =========================================================

class FrequenciaRecorrencia(str, enum.Enum):
    DIARIA = "DIARIA"
    SEMANAL = "SEMANAL"
    QUINZENAL = "QUINZENAL"
    MENSAL = "MENSAL"

# A. O Pedido do Usuário (Passo 1: Projeção)
class RecorrenciaRegraInput(BaseModel):
    customer_id: UUID = Field(..., description="ID do paciente")
    profissional_id: UUID = Field(..., description="ID do profissional")
    servico_id: Optional[UUID] = None
    recurso_id: Optional[UUID] = None
    
    data_hora_inicio_base: datetime = Field(..., description="Data e hora da primeira sessão")
    data_hora_fim_base: datetime = Field(..., description="Data e hora de término da primeira sessão")
    
    frequencia: FrequenciaRecorrencia = Field(..., description="Frequência das repetições")
    quantidade_sessoes: int = Field(..., gt=0, le=50, description="Número total de sessões (limite de 50 para segurança)")
    
    tenant_id: UUID = Field(..., description="ID da clínica (Tenant)")

# B. O Item Retornado pela Projeção (Rascunho)
class ProjecaoItem(BaseModel):
    indice: int = Field(..., description="Número da sessão (ex: 1, 2, 3...)")
    data_hora_inicio: datetime
    data_hora_fim: datetime
    disponivel: bool = Field(..., description="True se o horário está livre na agenda")
    conflito_detalhe: Optional[str] = Field(None, description="Mensagem de aviso se o horário estiver ocupado")

# C. A Resposta da Projeção para a Tela
class RecorrenciaProjecaoResponse(BaseModel):
    quantidade_solicitada: int
    quantidade_disponivel: int
    sessoes: List[ProjecaoItem]

# D. A Confirmação Final do Usuário (Passo 2: Efetivação)
class RecorrenciaCreateBatch(BaseModel):
    agendamentos: List[AppointmentCreate] = Field(..., description="Lista final de agendamentos revisados e aprovados")

