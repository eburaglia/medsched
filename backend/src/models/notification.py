import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    TELEGRAM = "telegram"

class NotificationStatus(str, enum.Enum):
    NA_FILA = "na_fila"
    PROCESSANDO = "processando"
    PROCESSADA = "processada"
    FALHA = "falha"

class NotificationTemplate(Base):
    """
    Cadastros padrões de notificação, parametrizáveis por Tenant.
    Se tenant_id for NULL, trata-se de um Template Genérico do Sistema (Molde de Fábrica).
    """
    __tablename__ = "notification_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # MÁGICA DO SAAS: nullable=True. Se nulo, é do Sistema. Se preenchido, é um clone do Cliente.
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Identificador interno para sabermos de qual molde essa cópia veio nos disparos automáticos
    codigo_interno = Column(String, nullable=False, index=True) # Ex: "lembrete_24h", "boas_vindas", "reset_senha"
    
    nome = Column(String, nullable=False) # Nome de exibição na tela de configurações
    canal = Column(SQLEnum(NotificationChannel), nullable=False)
    
    assunto = Column(String, nullable=True) # Usado para E-mail e In-App
    conteudo = Column(Text, nullable=False) # Suporta variáveis tipo {{cliente_nome}}
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

class NotificationLog(Base):
    """
    A Fila e o Histórico de tudo que foi trafegado no sistema (Audit Trail).
    """
    __tablename__ = "notification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relações (Quem enviou, para quem, sobre o que)
    remetente_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Se nulo, foi disparo automático do Sistema
    destinatario_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True, index=True) # Vínculo para a aba de histórico do Cliente
    
    # Para suportar respostas in-app (Thread/Histórico de mensagens da mesma conversa)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("notification_logs.id", ondelete="CASCADE"), nullable=True)

    # Dados da Mensagem Gerada
    canal = Column(SQLEnum(NotificationChannel), nullable=False)
    assunto = Column(String, nullable=True)
    conteudo = Column(Text, nullable=False) # O texto final já com as variáveis substituídas
    
    # Controle de Fila e Processamento
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.NA_FILA, nullable=False, index=True)
    erro_log = Column(Text, nullable=True) # Em caso de Falha, o admin consegue ler aqui o motivo
    
    # Controle de visualização (In-App)
    lida = Column(Boolean, default=False, index=True)
    
    # Auditoria de Tempo
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    processado_em = Column(DateTime, nullable=True)
    lido_em = Column(DateTime, nullable=True)
