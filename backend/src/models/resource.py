import enum
from sqlalchemy import Column, String, Integer, Boolean, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.base import AuditoriaMixin

class ResourceStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"

class ResourceType(str, enum.Enum):
    FISICO = "fisico"
    ONLINE = "online"

class Resource(AuditoriaMixin, Base):
    __tablename__ = "resources"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    status = Column(Enum(ResourceStatus), default=ResourceStatus.ATIVO, nullable=False)
    nome = Column(String(255), nullable=False)
    tipo = Column(Enum(ResourceType), nullable=False)
    capacidade_maxima = Column(Integer, default=1, nullable=False)
    requer_aprovacao = Column(Boolean, default=False, nullable=False)
    observacoes = Column(Text, nullable=True)

    tenant = relationship("Tenant")
