import enum
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.base import AuditoriaMixin

class UserStatus(str, enum.Enum):
    PENDENTE = "pendente"
    ATIVO = "ativo"
    INATIVO = "inativo"

class UserRole(str, enum.Enum):
    TENANT_ADMIN = "tenant_admin"
    PROFISSIONAL = "profissional"
    CLIENTE = "cliente"

class User(AuditoriaMixin, Base):
    __tablename__ = "users"

    # A Trava Multi-Tenant e Chave Estrangeira
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    status = Column(Enum(UserStatus), default=UserStatus.PENDENTE, nullable=False)
    papel = Column(Enum(UserRole), nullable=False)
    
    nome = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    cpf = Column(String(20), nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    
    recuperacao_token = Column(String(100), nullable=True)
    recuperacao_expira = Column(DateTime, nullable=True)
    
    endereco_logradouro = Column(String(255), nullable=False)
    endereco_cidade = Column(String(100), nullable=False)
    endereco_estado = Column(String(2), nullable=False)
    endereco_regiao = Column(String(50), nullable=False)
    telefone_contato = Column(String(20), nullable=False)
    
    observacoes = Column(Text, nullable=True)

    # Relacionamento Mágico (Permite buscar user.tenant no Python)
    tenant = relationship("Tenant")
