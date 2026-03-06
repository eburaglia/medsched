import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Date, Text, Enum
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class CustomerStatus(str, enum.Enum):
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"

class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(Enum(CustomerStatus), default=CustomerStatus.ATIVO, nullable=False)
    nome = Column(String(255), nullable=False, index=True)
    cpf_cnpj = Column(String(20), nullable=True) 
    data_nascimento = Column(Date, nullable=True) 
    genero = Column(String(50), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    endereco_logradouro = Column(String(255), nullable=True)
    endereco_numero = Column(String(50), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)
    endereco_cep = Column(String(20), nullable=True)
    observacoes = Column(Text, nullable=True)

    # Auditoria
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    criado_por = Column(String(255), nullable=True)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    alterado_por = Column(String(255), nullable=True)
    deletado_em = Column(DateTime, nullable=True)
    deletado_por = Column(String(255), nullable=True)
