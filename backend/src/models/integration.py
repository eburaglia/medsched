import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class IntegrationProvider(str, enum.Enum):
    SMTP = "smtp"           # Servidor de E-mail
    WHATSAPP = "whatsapp"   # API do WhatsApp (ex: Evolution API, Z-API, Twilio)
    TELEGRAM = "telegram"   # Bot do Telegram

class IntegrationConfig(Base):
    """
    Armazena as credenciais de disparo.
    Se tenant_id for NULL, é a configuração Global do Sistema (Ex: E-mail no-reply do Super Admin).
    """
    __tablename__ = "integration_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    
    provider = Column(SQLEnum(IntegrationProvider), nullable=False)
    
    # O Pulo do Gato: JSON permite salvar estruturas diferentes para cada provedor
    # Ex SMTP: {"host": "smtp.mailgun.org", "port": 587, "user": "...", "password": "..."}
    # Ex WPP: {"instance_name": "clinica_x", "api_key": "12345"}
    config_data = Column(JSON, nullable=False) 
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
