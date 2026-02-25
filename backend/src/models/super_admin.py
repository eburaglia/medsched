import enum
from sqlalchemy import Column, String, Enum
from src.database import Base
from src.models.base import AuditoriaMixin

class SuperAdminStatus(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"

class SuperAdmin(AuditoriaMixin, Base):
    __tablename__ = "super_admins"

    nome = Column(String(255), nullable=False)
    # O email deve ser único em todo o sistema de backoffice
    email = Column(String(255), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    
    status = Column(Enum(SuperAdminStatus), default=SuperAdminStatus.ATIVO, nullable=False)
