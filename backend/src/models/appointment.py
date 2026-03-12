from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID, ENUM
from src.database import Base
import uuid

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    
    data_hora_inicio = Column(DateTime, nullable=False, index=True)
    data_hora_fim = Column(DateTime, nullable=False)
    
    status = Column(String, default="agendado", nullable=False) # agendado, confirmado, cancelado, concluido
    observacoes = Column(Text, nullable=True)
    
    # 💰 NOVAS COLUNAS: Inteligência de Pré-Faturamento
    metodo_pagamento_previsto = Column(ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'CONVENIO', 'OUTRO', 'TRANSFERENCIA', 'BOLETO', name='paymentmethod', create_type=False), nullable=True)
    convenio_id = Column(UUID(as_uuid=True), ForeignKey("agreements.id", ondelete="SET NULL"), nullable=True)
    valor_base_servico = Column(Numeric(10,2), default=0.00)
    desconto_manual = Column(Numeric(10,2), default=0.00)
    acrescimo_manual = Column(Numeric(10,2), default=0.00)
    taxa_operadora_aplicada = Column(Numeric(10,2), default=0.00)
    valor_total_previsto = Column(Numeric(10,2), default=0.00)
    faturado = Column(Boolean, default=False)
