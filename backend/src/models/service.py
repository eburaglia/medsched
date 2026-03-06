import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, Text, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class ServiceStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"

class Service(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(Enum(ServiceStatus), default=ServiceStatus.ATIVO, nullable=False)
    nome = Column(String(255), nullable=False, index=True)
    duracao_minutos = Column(Integer, nullable=False)
    preco = Column(Numeric(10, 2), nullable=True)
    imagem_url = Column(String(500), nullable=True)
    observacoes = Column(Text, nullable=True)

    # Auditoria Completa
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    criado_por = Column(String(255), nullable=True)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    alterado_por = Column(String(255), nullable=True)
    deletado_em = Column(DateTime, nullable=True)
    deletado_por = Column(String(255), nullable=True)
