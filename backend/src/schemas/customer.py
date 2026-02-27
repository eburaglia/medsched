from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID

# 1. Base: Campos comuns
class CustomerBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=255, description="Nome completo ou Razão Social do cliente")
    cpf_cnpj: Optional[str] = Field(None, max_length=20, description="CPF ou CNPJ")
    data_nascimento: Optional[date] = Field(None, description="Data de nascimento ou fundação (YYYY-MM-DD)")
    genero: Optional[str] = Field(None, max_length=50)
    
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = Field(None, description="E-mail de contato")
    
    endereco_logradouro: Optional[str] = Field(None, max_length=255)
    endereco_numero: Optional[str] = Field(None, max_length=50)
    endereco_bairro: Optional[str] = Field(None, max_length=100)
    endereco_cidade: Optional[str] = Field(None, max_length=100)
    endereco_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    endereco_cep: Optional[str] = Field(None, max_length=20)
    
    observacoes: Optional[str] = Field(None, description="Observações gerais sobre o cliente")
    
    # O isolamento!
    tenant_id: UUID = Field(..., description="ID da empresa (Tenant) a qual este cliente pertence")

# 2. Formulário de Criação (Herda tudo da Base)
class CustomerCreate(CustomerBase):
    pass

# 3. Formulário de Atualização (Tudo é opcional, exceto o ID que vem na URL)
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

# 4. Formato de Resposta (O que a API devolve)
class CustomerResponse(CustomerBase):
    id: UUID
    criado_em: datetime
    alterado_em: datetime

    model_config = ConfigDict(from_attributes=True)
