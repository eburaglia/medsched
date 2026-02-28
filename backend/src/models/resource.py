import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class ResourceStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"

class ResourceType(str, enum.Enum):
    FISICO = "fisico"
    ONLINE = "online"

class Resource(Base):
    __tablename__ = "resources"

    # Chave Primária
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Isolamento Multi-Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Dados Inteligentes do Recurso
    status = Column(Enum(ResourceStatus), default=ResourceStatus.ATIVO, nullable=False)
    nome = Column(String(255), nullable=False, index=True)
    tipo = Column(Enum(ResourceType), nullable=False)
    capacidade_maxima = Column(Integer, default=1, nullable=False)
    requer_aprovacao = Column(Boolean, default=False, nullable=False)
    observacoes = Column(Text, nullable=True)

    # Auditoria explícita (Padrão do nosso banco)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
