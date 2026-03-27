from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from src.models.service_record import ServiceRecordType

class ServiceRecordBase(BaseModel):
    tipo: ServiceRecordType = Field(default=ServiceRecordType.NOTA_SESSAO, description="O tipo do registro (avaliação, nota, etc)")
    conteudo: str = Field(..., min_length=5, description="O texto detalhado do atendimento ou evolução")

class ServiceRecordCreate(ServiceRecordBase):
    tenant_id: UUID
    customer_id: UUID
    profissional_id: UUID
    appointment_id: Optional[UUID] = Field(default=None, description="Opcional: O ID do agendamento vinculado a esta ficha")

class ServiceRecordUpdate(BaseModel):
    # Uma vez criada, geralmente só alteramos o conteúdo ou a assinamos digitalmente
    conteudo: Optional[str] = Field(default=None, min_length=5)
    assinado: Optional[bool] = Field(default=None, description="Trava a ficha contra edições futuras")

class ServiceRecordResponse(ServiceRecordBase):
    id: UUID
    tenant_id: UUID
    customer_id: UUID
    profissional_id: UUID
    appointment_id: Optional[UUID]
    assinado: bool
    data_assinatura: Optional[datetime]
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(from_attributes=True)
