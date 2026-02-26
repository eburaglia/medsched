import enum
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.base import AuditoriaMixin

# 1. Domínio de Valores: Fluxo de Vida do Usuário
class UserStatus(str, enum.Enum):
    PENDENTE = "pendente"
    ATIVO = "ativo"
    INATIVO = "inativo"

# 2. Domínio de Valores: Controle de Acesso (RBAC)
class UserRole(str, enum.Enum):
    TENANT_ADMIN = "tenant_admin"
    MEDICO = "medico"           
    RECEPCAO = "recepcao"         
    CLIENTE = "cliente"           

class User(AuditoriaMixin, Base):
    __tablename__ = "users"

    # ---------------------------------------------------------
    # 🏢 ISOLAMENTO MULTI-TENANT (Preservado integralmente)
    # ---------------------------------------------------------
    tenant_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("tenants.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )

    # ---------------------------------------------------------
    # ⚙ CONTROLE DE ACESSO E STATUS
    # ---------------------------------------------------------
    status = Column(Enum(UserStatus), default=UserStatus.PENDENTE, nullable=False)
    papel = Column(Enum(UserRole), nullable=False)

    # ---------------------------------------------------------
    # 👤 DADOS PESSOAIS E DE LOGIN
    # ---------------------------------------------------------
    nome = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    cpf = Column(String(20), nullable=True, unique=True, index=True)
    telefone = Column(String(20), nullable=True)
    telefone_contato = Column(String(20), nullable=True)
    observacoes = Column(Text, nullable=True)

    # ---------------------------------------------------------
    # 📍 ENDEREÇO
    # ---------------------------------------------------------
    endereco_logradouro = Column(String(255), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)
    endereco_regiao = Column(String(50), nullable=True)

    # ---------------------------------------------------------
    # 🔐 SEGURANÇA E RECUPERAÇÃO DE SENHA
    # ---------------------------------------------------------
    senha_hash = Column(String(255), nullable=False)
    recuperacao_token = Column(String(100), nullable=True, index=True)
    recuperacao_expira = Column(DateTime, nullable=True)

    # ---------------------------------------------------------
    # 🔗 RELACIONAMENTOS ORM
    # ---------------------------------------------------------
    tenant = relationship("Tenant", backref="users")
