import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.database import Base

# --- ENUMS PARA CONTROLE DE ESTADO ---

class ImportEntityType(str, enum.Enum):
    CUSTOMER = "customer"
    PROFESSIONAL = "professional"
    SERVICE = "service"
    RESOURCE = "resource"

class ImportBatchStatus(str, enum.Enum):
    PENDING = "pending"              # Arquivo recebido
    PROCESSING = "processing"        # Validando linhas em background
    WAITING_APPROVAL = "waiting_approval" # Pronto para o Admin decidir
    COMPLETED = "completed"          # Importação efetivada
    FAILED = "failed"                # Erro crítico no arquivo

class ImportRowStatus(str, enum.Enum):
    PENDING = "pending"              # Ainda não validada
    VALID = "valid"                  # Dados corretos, pronta a importar
    INVALID = "invalid"              # Erro de validação
    DUPLICATED = "duplicated"        # Já existe na base principal
    IMPORTED = "imported"            # Promovida para a base oficial
    IGNORED = "ignored"              # O usuário decidiu não importar

# --- TABELAS ---

class ImportBatch(Base):
    """Cabeçalho do Lote de Importação (O arquivo que foi submetido)"""
    __tablename__ = "import_batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Corrigido: Usando comment= ao invés de description=
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="Quem fez o upload")
    
    entity_type = Column(Enum(ImportEntityType), nullable=False)
    file_name = Column(String(255), nullable=False)
    status = Column(Enum(ImportBatchStatus), default=ImportBatchStatus.PENDING, nullable=False)
    
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    rows = relationship("ImportRow", back_populates="batch", cascade="all, delete-orphan")


class ImportRow(Base):
    """As linhas individuais do arquivo Excel/CSV"""
    __tablename__ = "import_rows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Corrigidos os campos com comment=
    row_number = Column(Integer, nullable=False, comment="Numero da linha no arquivo original")
    raw_data = Column(JSONB, nullable=False, comment="Os dados exatos que vieram na linha")
    status = Column(Enum(ImportRowStatus), default=ImportRowStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True, comment="Detalhes do erro")
    
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    batch = relationship("ImportBatch", back_populates="rows")
