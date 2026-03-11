import uuid
from sqlalchemy import Column, Numeric, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base
from src.models.base import AuditoriaMixin

class ProfessionalService(AuditoriaMixin, Base):
    __tablename__ = "professional_services"
    __table_args__ = {"extend_existing": True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # SOBRESCRITA DE REGRAS (A Mágica)
    # Se for nulo, o sistema herda o preco/duracao_minutos da sua tabela Service original.
    preco_personalizado = Column(Numeric(10, 2), nullable=True) 
    duracao_personalizada_minutos = Column(Integer, nullable=True)
    
    # REGRAS DE COMISSIONAMENTO (O Split Financeiro)
    comissao_percentual = Column(Numeric(5, 2), default=0) # Ex: 50.00 (%)
    comissao_fixa = Column(Numeric(10, 2), default=0)      # Ex: R$ 20.00 fixos por atendimento
    
    ativo = Column(Boolean, default=True, nullable=False)
