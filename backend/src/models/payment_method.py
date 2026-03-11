import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base
from src.models.base import AuditoriaMixin

class PaymentMethod(AuditoriaMixin, Base):
    __tablename__ = "payment_methods"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    nome = Column(String(100), nullable=False) # Ex: Cartão de Crédito Visa
    taxa_fixa = Column(Numeric(10, 2), default=0) # Caso o gateway cobre por transação
    taxa_percentual = Column(Numeric(5, 2), default=0) # Ex: 2.99% do cartão
    prazo_recebimento_dias = Column(Numeric(3, 0), default=0) # Ex: 30 dias para cartão
    ativo = Column(Boolean, default=True)
