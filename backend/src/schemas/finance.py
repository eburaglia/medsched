from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from src.models.financial_category import CategoryType
from src.models.transaction import TransactionStatus, TransactionType

# ==========================================
# FINANCIAL CATEGORY SCHEMAS
# ==========================================
class FinancialCategoryBase(BaseModel):
    nome: str = Field(..., max_length=100)
    tipo: CategoryType
    cor_identificacao: Optional[str] = Field(None, max_length=20)
    ativo: Optional[bool] = True

class FinancialCategoryCreate(FinancialCategoryBase):
    pass

class FinancialCategoryUpdate(BaseModel):
    nome: Optional[str] = Field(None, max_length=100)
    tipo: Optional[CategoryType] = None
    cor_identificacao: Optional[str] = Field(None, max_length=20)
    ativo: Optional[bool] = None

class FinancialCategoryResponse(FinancialCategoryBase):
    id: UUID
    tenant_id: UUID
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# PAYMENT METHOD SCHEMAS
# ==========================================
class PaymentMethodBase(BaseModel):
    nome: str = Field(..., max_length=100)
    taxa_fixa: Optional[float] = 0.0
    taxa_percentual: Optional[float] = 0.0
    prazo_recebimento_dias: Optional[int] = 0
    ativo: Optional[bool] = True

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    nome: Optional[str] = Field(None, max_length=100)
    taxa_fixa: Optional[float] = None
    taxa_percentual: Optional[float] = None
    prazo_recebimento_dias: Optional[int] = None
    ativo: Optional[bool] = None

class PaymentMethodResponse(PaymentMethodBase):
    id: UUID
    tenant_id: UUID
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# TRANSACTION SCHEMAS
# ==========================================
class TransactionBase(BaseModel):
    tipo: TransactionType
    descricao: str = Field(..., max_length=255)
    
    valor_total: float
    valor_taxas: Optional[float] = 0.0
    valor_comissao: Optional[float] = 0.0
    valor_liquido: float
    
    data_vencimento: datetime
    data_pagamento: Optional[datetime] = None
    status: Optional[TransactionStatus] = TransactionStatus.PENDENTE
    observacoes: Optional[str] = None
    
    category_id: UUID
    payment_method_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    customer_id: Optional[UUID] = None
    professional_id: Optional[UUID] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    tipo: Optional[TransactionType] = None
    descricao: Optional[str] = Field(None, max_length=255)
    valor_total: Optional[float] = None
    valor_taxas: Optional[float] = None
    valor_comissao: Optional[float] = None
    valor_liquido: Optional[float] = None
    data_vencimento: Optional[datetime] = None
    data_pagamento: Optional[datetime] = None
    status: Optional[TransactionStatus] = None
    observacoes: Optional[str] = None
    category_id: Optional[UUID] = None
    payment_method_id: Optional[UUID] = None
    professional_id: Optional[UUID] = None

class TransactionResponse(TransactionBase):
    id: UUID
    tenant_id: UUID
    criado_em: datetime
    alterado_em: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
