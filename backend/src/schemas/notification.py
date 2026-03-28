from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from src.models.notification import NotificationChannel, NotificationStatus

class TemplateBase(BaseModel):
    nome: str
    canal: NotificationChannel
    assunto: Optional[str] = None
    conteudo: str
    ativo: bool = True

class TemplateCreate(TemplateBase):
    tenant_id: Optional[UUID] = None
    codigo_interno: str

class TemplateUpdate(BaseModel):
    nome: Optional[str] = None
    assunto: Optional[str] = None
    conteudo: Optional[str] = None
    ativo: Optional[bool] = None

class TemplateResponse(TemplateBase):
    id: UUID
    tenant_id: Optional[UUID]
    codigo_interno: str
    criado_em: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationLogResponse(BaseModel):
    id: UUID
    remetente_id: Optional[UUID]
    destinatario_id: UUID
    assunto: Optional[str]
    conteudo: str
    lida: bool
    criado_em: datetime
    model_config = ConfigDict(from_attributes=True)

# 👇 DRCODE: Novo Schema para a tabela de Histórico do Cliente
class NotificationHistoryResponse(BaseModel):
    id: UUID
    canal: NotificationChannel
    assunto: Optional[str]
    conteudo: str
    status: NotificationStatus
    erro_log: Optional[str]
    criado_em: datetime
    processado_em: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)
