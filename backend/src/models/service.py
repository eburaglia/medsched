import enum
from sqlalchemy import Column, String, Integer, Numeric, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.base import AuditoriaMixin

class ServiceStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"

class Service(AuditoriaMixin, Base):
    __tablename__ = "services"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    status = Column(Enum(ServiceStatus), default=ServiceStatus.ATIVO, nullable=False)
    nome = Column(String(255), nullable=False)
    duracao_minutos = Column(Integer, nullable=False)
    preco = Column(Numeric(10, 2), nullable=True)
    imagem_url = Column(String(500), nullable=True)
    observacoes = Column(Text, nullable=True)

    tenant = relationship("Tenant")
