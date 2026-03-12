from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from decimal import Decimal

# --- TAXAS DE PAGAMENTO ---
class PaymentFeeBase(BaseModel):
    metodo_pagamento: str
    tipo_taxa: str 
    valor_taxa: Decimal
    repassar_ao_cliente: bool

class PaymentFeeCreate(PaymentFeeBase):
    tenant_id: UUID

class PaymentFeeUpdate(BaseModel):
    tipo_taxa: Optional[str] = None
    valor_taxa: Optional[Decimal] = None
    repassar_ao_cliente: Optional[bool] = None

class PaymentFeeResponse(PaymentFeeBase):
    id: UUID
    tenant_id: UUID
    class Config:
        from_attributes = True

# --- PARCERIAS / CONVÊNIOS ---
class AgreementBase(BaseModel):
    nome: str
    ativo: bool = True

class AgreementCreate(AgreementBase):
    tenant_id: UUID

class AgreementUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class AgreementResponse(AgreementBase):
    id: UUID
    tenant_id: UUID
    class Config:
        from_attributes = True

# --- PREÇOS ESPECÍFICOS POR SERVIÇO ---
class ServicePriceItem(BaseModel):
    service_id: UUID
    valor_acordado: Decimal

class AgreementPricesUpdate(BaseModel):
    tenant_id: UUID
    prices: List[ServicePriceItem]

class AgreementPriceResponse(BaseModel):
    service_id: UUID
    valor_acordado: Decimal
    class Config:
        from_attributes = True
