from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from src.models.supplier import SupplierStatus

class SupplierBase(BaseModel):
    nome_razao: str = Field(..., min_length=2, max_length=255)
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    contato_nome: Optional[str] = None
    
    endereco_cep: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    
    observacoes: Optional[str] = None
    status: SupplierStatus = Field(default=SupplierStatus.ATIVO)
    tenant_id: UUID

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    nome_razao: Optional[str] = None
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    contato_nome: Optional[str] = None
    endereco_cep: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[SupplierStatus] = None

class SupplierResponse(SupplierBase):
    id: UUID
    criado_em: datetime
    alterado_em: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
