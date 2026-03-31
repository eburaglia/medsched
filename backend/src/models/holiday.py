from sqlalchemy import Column, String, Date, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from src.database import Base

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    nome = Column(String, nullable=False)
    data = Column(Date, nullable=False)
    tipo = Column(String, nullable=False) # Ex: FEDERAL, ESTADUAL, MUNICIPAL, AD-HOC
    havera_expediente = Column(Boolean, default=False, nullable=False)

    criado_em = Column(DateTime, default=datetime.utcnow)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
