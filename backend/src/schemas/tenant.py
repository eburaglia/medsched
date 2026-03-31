from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from src.models.tenant import TenantStatus

class TenantBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=255)
    nome_fantasia: Optional[str] = Field(None, max_length=255)
    cnpj: Optional[str] = Field(None, max_length=20)
    inscricao_estadual: Optional[str] = Field(None, max_length=50)
    inscricao_municipal: Optional[str] = Field(None, max_length=50)
    
    segmento_atuacao: str = Field(..., max_length=100)
    fuso_horario: str = Field(..., max_length=50)
    
    endereco_cep: Optional[str] = Field(None, max_length=20)
    endereco_logradouro: str = Field(..., max_length=255)
    endereco_numero: Optional[str] = Field(None, max_length=50)
    endereco_bairro: Optional[str] = Field(None, max_length=100)
    endereco_cidade: str = Field(..., max_length=100)
    endereco_estado: str = Field(..., min_length=2, max_length=2)
    endereco_regiao: str = Field(..., max_length=50)
    
    site_url: str = Field(..., max_length=255)
    email_contato: EmailStr = Field(...)
    telefone_contato: str = Field(..., max_length=20)
    
    # 👇 DRCODE: Campos de Redes Sociais adicionados
    facebook_url: Optional[str] = Field(None, max_length=255)
    twitter_url: Optional[str] = Field(None, max_length=255)
    instagram_url: Optional[str] = Field(None, max_length=255)
    youtube_url: Optional[str] = Field(None, max_length=255)
    tiktok_url: Optional[str] = Field(None, max_length=255)
    
    dominio_interno: str = Field(..., max_length=100)
    url_externa: str = Field(..., max_length=255)
    logotipo_url: str = Field(..., max_length=500)
    observacoes: Optional[str] = None
    status: Optional[TenantStatus] = Field(default=TenantStatus.PHASE_IN)
    configuracoes_visuais: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TenantCreate(TenantBase):
    validade_assinatura: datetime

class TenantUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3, max_length=255)
    nome_fantasia: Optional[str] = Field(None, max_length=255)
    cnpj: Optional[str] = Field(None, max_length=20)
    inscricao_estadual: Optional[str] = Field(None, max_length=50)
    inscricao_municipal: Optional[str] = Field(None, max_length=50)
    
    segmento_atuacao: Optional[str] = Field(None, max_length=100)
    fuso_horario: Optional[str] = Field(None, max_length=50)
    
    endereco_cep: Optional[str] = Field(None, max_length=20)
    endereco_logradouro: Optional[str] = Field(None, max_length=255)
    endereco_numero: Optional[str] = Field(None, max_length=50)
    endereco_bairro: Optional[str] = Field(None, max_length=100)
    endereco_cidade: Optional[str] = Field(None, max_length=100)
    endereco_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    endereco_regiao: Optional[str] = Field(None, max_length=50)
    
    site_url: Optional[str] = Field(None, max_length=255)
    email_contato: Optional[EmailStr] = None
    telefone_contato: Optional[str] = Field(None, max_length=20)
    
    # 👇 DRCODE: Campos de Redes Sociais no Update
    facebook_url: Optional[str] = Field(None, max_length=255)
    twitter_url: Optional[str] = Field(None, max_length=255)
    instagram_url: Optional[str] = Field(None, max_length=255)
    youtube_url: Optional[str] = Field(None, max_length=255)
    tiktok_url: Optional[str] = Field(None, max_length=255)
    
    dominio_interno: Optional[str] = Field(None, max_length=100)
    url_externa: Optional[str] = Field(None, max_length=255)
    logotipo_url: Optional[str] = Field(None, max_length=500)
    observacoes: Optional[str] = None
    status: Optional[TenantStatus] = None
    validade_assinatura: Optional[datetime] = None
    configuracoes_visuais: Optional[Dict[str, Any]] = None

class TenantResponse(TenantBase):
    id: UUID
    codigo_visual: int
    validade_assinatura: datetime
    
    criado_em: datetime
    criado_por: Optional[UUID] = None
    criado_por_nome: Optional[str] = None
    
    alterado_em: Optional[datetime] = None
    alterado_por: Optional[UUID] = None
    alterado_por_nome: Optional[str] = None
    
    deletado_em: Optional[datetime] = None
    deletado_por: Optional[UUID] = None
    deletado_por_nome: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
