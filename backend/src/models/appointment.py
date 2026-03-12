from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID, ENUM
from src.database import Base
import uuid
import enum

# CORREÇÃO AQUI: Valores das strings alinhados com o Banco de Dados (Maiúsculo)
class AppointmentStatus(str, enum.Enum):
    PENDENTE = "PENDENTE"
    CONFIRMADO = "CONFIRMADO"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO_CLIENTE = "CANCELADO_CLIENTE"
    CANCELADO_PROFISSIONAL = "CANCELADO_PROFISSIONAL"
    NO_SHOW = "NO_SHOW"

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    servico_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    grupo_recorrencia_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    data_hora_inicio = Column(DateTime, nullable=False, index=True)
    data_hora_fim = Column(DateTime, nullable=False)
    
    status = Column(String, default=AppointmentStatus.PENDENTE, nullable=False)
    observacoes_internas = Column(Text, nullable=True)
    
    criado_por = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    alterado_por = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    criado_em = Column(DateTime, nullable=True)
    alterado_em = Column(DateTime, nullable=True)
    deletado_em = Column(DateTime, nullable=True)

    metodo_pagamento_previsto = Column(ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'CONVENIO', 'OUTRO', 'TRANSFERENCIA', 'BOLETO', name='paymentmethod', create_type=False), nullable=True)
    convenio_id = Column(UUID(as_uuid=True), ForeignKey("agreements.id", ondelete="SET NULL"), nullable=True)
    valor_base_servico = Column(Numeric(10,2), default=0.00)
    desconto_manual = Column(Numeric(10,2), default=0.00)
    acrescimo_manual = Column(Numeric(10,2), default=0.00)
    taxa_operadora_aplicada = Column(Numeric(10,2), default=0.00)
    valor_total_previsto = Column(Numeric(10,2), default=0.00)
    faturado = Column(Boolean, default=False)
