from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from src.models.financial import TransactionType, TransactionStatus, PaymentMethod

class FinancialTransactionBase(BaseModel):
    descricao: str = Field(..., min_length=3, description="Descrição da receita ou despesa")
    valor: Decimal = Field(..., gt=0, description="Valor monetário da transação (maior que zero)")
    tipo: TransactionType
    status: TransactionStatus = Field(default=TransactionStatus.PENDENTE)
    metodo_pagamento: Optional[PaymentMethod] = None
    data_vencimento: date
    data_pagamento: Optional[datetime] = None

class FinancialTransactionCreate(FinancialTransactionBase):
    tenant_id: UUID
    customer_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None

class FinancialTransactionUpdate(BaseModel):
    descricao: Optional[str] = Field(None, min_length=3)
    valor: Optional[Decimal] = Field(None, gt=0)
    status: Optional[TransactionStatus] = None
    metodo_pagamento: Optional[PaymentMethod] = None
    data_vencimento: Optional[date] = None
    data_pagamento: Optional[datetime] = None

class FinancialTransactionResponse(FinancialTransactionBase):
    id: UUID
    tenant_id: UUID
    customer_id: Optional[UUID]
    appointment_id: Optional[UUID]
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(from_attributes=True)
