from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from src.models.resource import ResourceType, ResourceStatus

class ResourceBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255, description="Nome da Sala/Equipamento/Link")
    tipo: ResourceType = Field(..., description="Físico ou Online")
    status: Optional[ResourceStatus] = Field(default=ResourceStatus.ATIVO)
    capacidade_maxima: Optional[int] = Field(default=1, ge=1, description="Capacidade máxima de uso")
    requer_aprovacao: Optional[bool] = Field(default=False, description="Requer aprovação?")
    observacoes: Optional[str] = Field(None, description="Observações ou links")
    tenant_id: UUID = Field(..., description="ID da clínica")

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    tipo: Optional[ResourceType] = None
    status: Optional[ResourceStatus] = None
    capacidade_maxima: Optional[int] = Field(None, ge=1)
    requer_aprovacao: Optional[bool] = None
    observacoes: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: UUID
    criado_em: datetime
    criado_por: Optional[str] = None
    alterado_em: datetime
    alterado_por: Optional[str] = None
    deletado_em: Optional[datetime] = None
    deletado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
