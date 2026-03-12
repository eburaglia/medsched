from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from uuid import UUID

class TransactionBase(BaseModel):
    descricao: str
    valor: float
    tipo: str
    status: str
    data_vencimento: date
    metodo_pagamento: Optional[str] = None
    data_pagamento: Optional[datetime] = None # 🛠️ CORREÇÃO: Mudado para datetime
    customer_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None

class TransactionCreate(TransactionBase):
    tenant_id: UUID

class TransactionUpdate(BaseModel):
    descricao: Optional[str] = None
    valor: Optional[float] = None
    tipo: Optional[str] = None
    status: Optional[str] = None
    data_vencimento: Optional[date] = None
    metodo_pagamento: Optional[str] = None
    data_pagamento: Optional[datetime] = None # 🛠️ CORREÇÃO: Mudado para datetime

class TransactionResponse(TransactionBase):
    id: UUID
    tenant_id: UUID
    criado_em: datetime
    alterado_em: datetime

    class Config:
        from_attributes = True
