from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from src.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    telefone: Optional[str] = None
    telefone_contato: Optional[str] = None
    cpf: Optional[str] = None
    observacoes: Optional[str] = None
    
    # Endereço (Todos Opcionais com default None)
    endereco_cep: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_regiao: Optional[str] = None
    
    papel: UserRole
    status: UserStatus = Field(default=UserStatus.PENDENTE)
    tenant_id: UUID

class UserCreate(UserBase):
    senha: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    telefone_contato: Optional[str] = None
    status: Optional[UserStatus] = None
    papel: Optional[UserRole] = None
    
    # Endereço no Update
    endereco_cep: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_regiao: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    criado_em: datetime
    alterado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
