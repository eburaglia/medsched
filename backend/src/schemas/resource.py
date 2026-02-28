from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from src.models.resource import ResourceType, ResourceStatus

# 1. Base: Campos comuns
class ResourceBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255, description="Nome da Sala/Equipamento/Link")
    tipo: ResourceType = Field(..., description="Físico ou Online")
    
    status: Optional[ResourceStatus] = Field(default=ResourceStatus.ATIVO)
    capacidade_maxima: Optional[int] = Field(default=1, ge=1, description="Quantas pessoas cabem/podem usar ao mesmo tempo")
    requer_aprovacao: Optional[bool] = Field(default=False, description="Precisa de aprovação da gerência para agendar?")
    observacoes: Optional[str] = Field(None, description="Observações ou links de acesso")
    
    tenant_id: UUID = Field(..., description="ID da clínica (Tenant)")

# 2. Formulário de Criação
class ResourceCreate(ResourceBase):
    pass

# 3. Formulário de Atualização (Tudo é opcional)
class ResourceUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    tipo: Optional[ResourceType] = None
    status: Optional[ResourceStatus] = None
    capacidade_maxima: Optional[int] = Field(None, ge=1)
    requer_aprovacao: Optional[bool] = None
    observacoes: Optional[str] = None

# 4. Formato de Resposta
class ResourceResponse(ResourceBase):
    id: UUID
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(from_attributes=True)
