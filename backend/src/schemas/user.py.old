from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from src.models.user import UserRole, UserStatus

# 1. Base: Campos comuns a todas as operações
class UserBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=255, description="Nome completo do usuário")
    email: EmailStr = Field(..., description="E-mail único para login")
    telefone: Optional[str] = Field(None, max_length=20)
    telefone_contato: Optional[str] = Field(None, max_length=20, description="Telefone secundário/contato")
    cpf: Optional[str] = Field(None, max_length=20, description="CPF do usuário")
    observacoes: Optional[str] = Field(None, description="Observações gerais sobre o usuário")
    
    # Endereço (Restaurado)
    endereco_logradouro: Optional[str] = Field(None, max_length=255)
    endereco_cidade: Optional[str] = Field(None, max_length=100)
    endereco_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    endereco_regiao: Optional[str] = Field(None, max_length=50)
    
    papel: UserRole = Field(..., description="Nível de permissão no sistema")
    status: UserStatus = Field(default=UserStatus.PENDENTE, description="Estado atual da conta")
    
    # Isolamento Multi-Tenant
    tenant_id: UUID = Field(..., description="ID da clínica a qual este usuário pertence")

# 2. Formulário de Criação
class UserCreate(UserBase):
    senha: str = Field(..., min_length=8, description="Senha forte para acesso")

# 3. Formulário de Atualização
class UserUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3, max_length=255)
    telefone: Optional[str] = Field(None, max_length=20)
    telefone_contato: Optional[str] = Field(None, max_length=20)
    observacoes: Optional[str] = None
    status: Optional[UserStatus] = None
    papel: Optional[UserRole] = None
    
    endereco_logradouro: Optional[str] = Field(None, max_length=255)
    endereco_cidade: Optional[str] = Field(None, max_length=100)
    endereco_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    endereco_regiao: Optional[str] = Field(None, max_length=50)

# 4. Formato de Resposta
class UserResponse(UserBase):
    id: UUID
    criado_em: datetime
    alterado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
