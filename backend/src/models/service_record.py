import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class ServiceRecordType(str, enum.Enum):
    AVALIACAO_INICIAL = "avaliacao_inicial"
    NOTA_SESSAO = "nota_sessao"
    RECOMENDACAO = "recomendacao"
    DOCUMENTO = "documento"
    INTERNO = "interno"

class ServiceRecord(Base):
    """
    Modelo Agnóstico de Registro de Atendimento/Serviço.
    Pode representar um Prontuário Médico, Ficha de Treino, Relatório de Consultoria, etc.
    """
    __tablename__ = "service_records"

    # Chave Primária
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Chaves Estrangeiras (Rastreabilidade Multi-Tenant)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Quem prestou o serviço/escreveu o registro
    profissional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Vínculo opcional com a sessão/agendamento específico
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)

    # Conteúdo
    tipo = Column(Enum(ServiceRecordType), default=ServiceRecordType.NOTA_SESSAO, nullable=False)
    conteudo = Column(Text, nullable=False)
    
    # Segurança / Assinatura Eletrônica
    assinado = Column(Boolean, default=False, nullable=False)
    data_assinatura = Column(DateTime, nullable=True)

    # Auditoria
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
