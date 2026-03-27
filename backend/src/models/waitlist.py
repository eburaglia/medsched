from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base
import uuid
import enum
from datetime import datetime

class WaitlistStatus(str, enum.Enum):
    AGUARDANDO = "AGUARDANDO"
    NOTIFICADO = "NOTIFICADO" # Quando a vaga surge e avisamos o cliente (as 24h correndo)
    AGENDADO = "AGENDADO"     # Quando ele aceita e vira um agendamento real
    EXPIRADO = "EXPIRADO"     # Passou das 24h e ele não respondeu/recusou
    CANCELADO = "CANCELADO"   # Cliente desistiu da fila

class Waitlist(Base):
    __tablename__ = "waitlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Quem está na fila e o que quer
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    servico_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Profissional é opcional. Se for nulo, o cliente aceita fazer com qualquer profissional disponível
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # A Janela de Atendimento que o cliente deseja
    data_hora_inicio_desejada = Column(DateTime, nullable=False, index=True)
    data_hora_fim_desejada = Column(DateTime, nullable=False, index=True)
    
    status = Column(String, default=WaitlistStatus.AGUARDANDO, nullable=False, index=True)
    observacoes = Column(Text, nullable=True)
    
    # Campos de Auditoria (Padrão do seu sistema)
    criado_por = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    alterado_por = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Para controle da regra de 24h
    notificado_em = Column(DateTime, nullable=True)
