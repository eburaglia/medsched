from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from src.models.service import ServiceStatus

class ServiceBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255, description="Nome do serviço")
    duracao_minutos: int = Field(..., gt=0, description="Duração padrão em minutos")
    preco: Optional[Decimal] = Field(None, ge=0, description="Preço base")
    imagem_url: Optional[str] = Field(None, max_length=500)
    observacoes: Optional[str] = Field(None)
    status: Optional[ServiceStatus] = Field(default=ServiceStatus.ATIVO)
    tenant_id: UUID = Field(...)

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    duracao_minutos: Optional[int] = Field(None, gt=0)
    preco: Optional[Decimal] = Field(None, ge=0)
    imagem_url: Optional[str] = Field(None, max_length=500)
    observacoes: Optional[str] = None
    status: Optional[ServiceStatus] = None

class ServiceResponse(ServiceBase):
    id: UUID
    criado_em: datetime
    criado_por: Optional[str] = None
    alterado_em: datetime
    alterado_por: Optional[str] = None
    deletado_em: Optional[datetime] = None
    deletado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
