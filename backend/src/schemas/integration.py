from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from src.models.integration import IntegrationProvider

class IntegrationBase(BaseModel):
    provider: IntegrationProvider
    config_data: Dict[str, Any]
    ativo: bool = True

class IntegrationCreate(IntegrationBase):
    pass

class IntegrationUpdate(BaseModel):
    config_data: Optional[Dict[str, Any]] = None
    ativo: Optional[bool] = None

class IntegrationResponse(IntegrationBase):
    id: UUID
    tenant_id: Optional[UUID]
    criado_em: datetime
    atualizado_em: datetime
    model_config = ConfigDict(from_attributes=True)
