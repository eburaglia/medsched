import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Enum, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.base import AuditoriaMixin

class ImportEntityType(str, enum.Enum):
    CUSTOMER = "customer"
    HOLIDAY = "holiday"
    SUPPLIER = "supplier"

class ImportBatchStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    VALIDATED = "validated"
    WAITING_APPROVAL = "waiting_approval" # 👈 DRCODE: Agora em minúsculo para casar com o Frontend
    COMPLETED = "completed"
    FAILED = "failed"

class ImportRowStatus(str, enum.Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"
    DUPLICATED = "duplicated"
    PROMOTED = "promoted"
    ERROR = "error"

class ImportBatch(AuditoriaMixin, Base):
    __tablename__ = "import_batches"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(Enum(ImportEntityType), nullable=False)
    status = Column(Enum(ImportBatchStatus), default=ImportBatchStatus.PENDING, nullable=False)
    file_name = Column(String(255), nullable=False)
    
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    rows = relationship("ImportRow", backref="batch", cascade="all, delete-orphan")

class ImportRow(Base):
    __tablename__ = "import_rows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    raw_data = Column(JSONB, nullable=False)
    status = Column(Enum(ImportRowStatus), default=ImportRowStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True)
    
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
