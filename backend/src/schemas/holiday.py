from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from uuid import UUID

class HolidayBase(BaseModel):
    nome: str
    data: date
    tipo: str
    havera_expediente: bool = False

class HolidayCreate(HolidayBase):
    tenant_id: UUID

class HolidayUpdate(BaseModel):
    nome: Optional[str] = None
    data: Optional[date] = None
    tipo: Optional[str] = None
    havera_expediente: Optional[bool] = None

class HolidayResponse(HolidayBase):
    id: UUID
    tenant_id: UUID
    criado_em: datetime
    alterado_em: datetime

    class Config:
        from_attributes = True
