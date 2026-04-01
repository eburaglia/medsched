import enum
from sqlalchemy import Column, String, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base
from src.models.base import AuditoriaMixin

class SupplierStatus(str, enum.Enum):
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"

class Supplier(AuditoriaMixin, Base):
    __tablename__ = "suppliers"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(SupplierStatus, values_callable=lambda obj: [e.value for e in obj]), default=SupplierStatus.ATIVO, nullable=False)
    
    nome_razao = Column(String(255), nullable=False)
    nome_fantasia = Column(String(255), nullable=True)
    cnpj = Column(String(20), nullable=True, index=True)
    
    email = Column(String(255), nullable=True)
    telefone = Column(String(20), nullable=True)
    contato_nome = Column(String(100), nullable=True) # Nome do vendedor/representante

    endereco_cep = Column(String(20), nullable=True)
    endereco_logradouro = Column(String(255), nullable=True)
    endereco_numero = Column(String(50), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)

    observacoes = Column(Text, nullable=True)
