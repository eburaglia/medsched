from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from src.models.tenant import TenantStatus

# 1. Base: Campos comuns a todas as operações
class TenantBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=255, description="Razão Social da Clínica/Empresa")
    nome_fantasia: Optional[str] = Field(None, max_length=255)
    cnpj: Optional[str] = Field(None, max_length=20, description="CNPJ com ou sem pontuação")
    segmento_atuacao: str = Field(..., max_length=100)
    fuso_horario: str = Field(..., max_length=50, description="Ex: America/Sao_Paulo")
    
    # Endereço
    endereco_logradouro: str = Field(..., max_length=255)
    endereco_cidade: str = Field(..., max_length=100)
    endereco_estado: str = Field(..., min_length=2, max_length=2)
    endereco_regiao: str = Field(..., max_length=50)
    
    # Contato e Web
    site_url: str = Field(..., max_length=255)
    email_contato: EmailStr = Field(..., description="Valida automaticamente se é um email real")
    telefone_contato: str = Field(..., max_length=20)
    
    dominio_interno: str = Field(..., max_length=100, description="Prefixo para URL única (ex: clinica-vida)")
    url_externa: str = Field(..., max_length=255)
    logotipo_url: str = Field(..., max_length=500)
    
    observacoes: Optional[str] = None

# 2. Formulário de Criação (O que o Frontend envia no POST)
class TenantCreate(TenantBase):
    # A validade da assinatura é exigida na criação
    validade_assinatura: datetime

# 3. Formulário de Atualização (O que o Frontend envia no PUT/PATCH)
class TenantUpdate(BaseModel):
    # Todos os campos são opcionais, pois a clínica pode querer atualizar só o telefone
    nome_fantasia: Optional[str] = Field(None, max_length=255)
    telefone_contato: Optional[str] = Field(None, max_length=20)
    endereco_logradouro: Optional[str] = Field(None, max_length=255)
    logotipo_url: Optional[str] = Field(None, max_length=500)
    status: Optional[TenantStatus] = None

# 4. Formato de Resposta (O que a API devolve para o Frontend)
class TenantResponse(TenantBase):
    id: UUID
    codigo_visual: int
    status: TenantStatus
    validade_assinatura: datetime
    
    # Campos de Auditoria
    criado_em: datetime
    alterado_em: Optional[datetime] = None

    # Configuração vital: Ensina o Pydantic a ler objetos do SQLAlchemy (Banco de Dados)
    model_config = ConfigDict(from_attributes=True)
