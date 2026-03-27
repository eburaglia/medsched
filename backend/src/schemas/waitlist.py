from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class WaitlistBase(BaseModel):
    customer_id: UUID
    servico_id: UUID
    professional_id: Optional[UUID] = None
    data_hora_inicio_desejada: datetime
    data_hora_fim_desejada: datetime
    status: Optional[str] = "AGUARDANDO"
    observacoes: Optional[str] = None

class WaitlistCreate(WaitlistBase):
    tenant_id: UUID

class WaitlistUpdate(BaseModel):
    professional_id: Optional[UUID] = None
    data_hora_inicio_desejada: Optional[datetime] = None
    data_hora_fim_desejada: Optional[datetime] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None
    notificado_em: Optional[datetime] = None

class WaitlistResponse(WaitlistBase):
    id: UUID
    tenant_id: UUID
    criado_em: datetime
    notificado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True
