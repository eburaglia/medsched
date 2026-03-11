import enum
import uuid
from sqlalchemy import Column, String, Enum, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base
from src.models.base import AuditoriaMixin

class CategoryType(str, enum.Enum):
    RECEITA = "receita"
    DESPESA = "despesa"

class FinancialCategory(AuditoriaMixin, Base):
    __tablename__ = "financial_categories"
    __table_args__ = {"extend_existing": True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    nome = Column(String(100), nullable=False)
    tipo = Column(Enum(CategoryType), nullable=False)
    cor_identificacao = Column(String(20), nullable=True) # Para brilhar nos gráficos depois
    ativo = Column(Boolean, default=True)
