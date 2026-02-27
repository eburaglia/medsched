from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from src.models.service import ServiceStatus

# 1. Base: Campos comuns
class ServiceBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255, description="Nome do serviço (Ex: Limpeza Dental)")
    duracao_minutos: int = Field(..., gt=0, description="Duração padrão em minutos")
    preco: Optional[Decimal] = Field(None, ge=0, description="Preço base do serviço")
    
    imagem_url: Optional[str] = Field(None, max_length=500, description="URL da imagem ilustrativa")
    observacoes: Optional[str] = Field(None, description="Observações internas")
    
    status: Optional[ServiceStatus] = Field(default=ServiceStatus.ATIVO)
    
    tenant_id: UUID = Field(..., description="ID da clínica (Tenant)")

# 2. Formulário de Criação (Herda tudo da Base)
class ServiceCreate(ServiceBase):
    pass

# 3. Formulário de Atualização (Tudo é opcional)
class ServiceUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    duracao_minutos: Optional[int] = Field(None, gt=0)
    preco: Optional[Decimal] = Field(None, ge=0)
    imagem_url: Optional[str] = Field(None, max_length=500)
    observacoes: Optional[str] = None
    status: Optional[ServiceStatus] = None

# 4. Formato de Resposta (O que a API devolve)
class ServiceResponse(ServiceBase):
    id: UUID
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(from_attributes=True)
