from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
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
    
    endereco_cep: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_regiao: Optional[str] = None
    
    preferencias_ui: Optional[Dict[str, Any]] = None
    
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
    
    endereco_cep: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_regiao: Optional[str] = None
    
    preferencias_ui: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: UUID
    criado_em: datetime
    criado_por: Optional[UUID] = None
    alterado_em: Optional[datetime] = None
    alterado_por: Optional[UUID] = None
    deletado_em: Optional[datetime] = None
    deletado_por: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)
