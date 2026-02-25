import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID

class AuditoriaMixin:
    """
    Mixin de Auditoria: Qualquer tabela que herdar esta classe
    ganhará estes campos automaticamente, garantindo nosso padrão de segurança.
    """
    # Chave Primária segura baseada em UUID (impede ataques de enumeração - IDOR)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Campos de rastreabilidade (Governança)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    criado_por = Column(UUID(as_uuid=True), nullable=True) # Nulo se for auto-cadastro
    
    # onupdate atualiza o campo magicamente toda vez que a linha for modificada
    alterado_em = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    alterado_por = Column(UUID(as_uuid=True), nullable=True)
    
    # Soft Delete (Nunca apagamos dados sensíveis, apenas carimbamos a data de exclusão)
    deletado_em = Column(DateTime, nullable=True)
    deletado_por = Column(UUID(as_uuid=True), nullable=True)
