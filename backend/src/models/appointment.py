import enum
from sqlalchemy import Column, Integer, Numeric, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.base import AuditoriaMixin

class AppointmentStatus(str, enum.Enum):
    PENDENTE = "pendente"
    CONFIRMADO = "confirmado"
    CONCLUIDO = "concluido"
    CANCELADO_CLIENTE = "cancelado_cliente"
    CANCELADO_PROFISSIONAL = "cancelado_profissional"
    NO_SHOW = "no_show"

class Appointment(AuditoriaMixin, Base):
    __tablename__ = "appointments"

    # Chaves Estrangeiras (Onde tudo se conecta)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    profissional_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    servico_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    recurso_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"), nullable=True, index=True)
    
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDENTE, nullable=False)
    
    # A Fotografia do Agendamento
    data_hora_inicio = Column(DateTime, nullable=False, index=True)
    data_hora_fim = Column(DateTime, nullable=False, index=True)
    duracao_aplicada = Column(Integer, nullable=False)
    preco_aplicado = Column(Numeric(10, 2), nullable=False)
    grupo_recorrencia_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    observacoes_cliente = Column(Text, nullable=True)
    observacoes_internas = Column(Text, nullable=True)

    # Mapeamento de Relacionamentos para o Python
    tenant = relationship("Tenant")
    cliente = relationship("User", foreign_keys=[cliente_id])
    profissional = relationship("User", foreign_keys=[profissional_id])
    servico = relationship("Service")
    recurso = relationship("Resource")
