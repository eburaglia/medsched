from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID

from src.models.customer import CustomerStatus

class CustomerBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=255, description="Nome completo ou Razão Social")
    cpf_cnpj: Optional[str] = Field(None, max_length=20)
    data_nascimento: Optional[date] = Field(None, description="Data de nascimento ou fundação")
    genero: Optional[str] = Field(None, max_length=50)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = Field(None)
    endereco_logradouro: Optional[str] = Field(None, max_length=255)
    endereco_numero: Optional[str] = Field(None, max_length=50)
    endereco_bairro: Optional[str] = Field(None, max_length=100)
    endereco_cidade: Optional[str] = Field(None, max_length=100)
    endereco_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    endereco_cep: Optional[str] = Field(None, max_length=20)
    observacoes: Optional[str] = Field(None)
    status: Optional[CustomerStatus] = Field(default=CustomerStatus.ATIVO)
    tenant_id: UUID = Field(...)

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3, max_length=255)
    cpf_cnpj: Optional[str] = Field(None, max_length=20)
    data_nascimento: Optional[date] = None
    genero: Optional[str] = Field(None, max_length=50)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    endereco_logradouro: Optional[str] = Field(None, max_length=255)
    endereco_numero: Optional[str] = Field(None, max_length=50)
    endereco_bairro: Optional[str] = Field(None, max_length=100)
    endereco_cidade: Optional[str] = Field(None, max_length=100)
    endereco_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    endereco_cep: Optional[str] = Field(None, max_length=20)
    observacoes: Optional[str] = None
    status: Optional[CustomerStatus] = None

class CustomerResponse(CustomerBase):
    id: UUID
    criado_em: datetime
    criado_por: Optional[str] = None
    alterado_em: datetime
    alterado_por: Optional[str] = None
    deletado_em: Optional[datetime] = None
    deletado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
