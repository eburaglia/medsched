import enum
from sqlalchemy import Column, String, Integer, Text, DateTime, Enum, Identity
from src.database import Base
from src.models.base import AuditoriaMixin

class TenantStatus(str, enum.Enum):
    PHASE_IN = "phase-in"
    ATIVO = "ativo"
    PHASE_OUT = "phase-out"
    INATIVO = "inativo"

class Tenant(AuditoriaMixin, Base):
    __tablename__ = "tenants"

    codigo_visual = Column(Integer, Identity(start=10000, cycle=False), unique=True, index=True, nullable=False)
    status = Column(Enum(TenantStatus), default=TenantStatus.PHASE_IN, nullable=False)
    
    nome = Column(String(255), nullable=False)
    nome_fantasia = Column(String(255), nullable=True)
    cnpj = Column(String(20), unique=True, index=True, nullable=True)
    segmento_atuacao = Column(String(100), nullable=False)
    fuso_horario = Column(String(50), nullable=False)

    # Endereço Completo
    endereco_cep = Column(String(20), nullable=True)
    endereco_logradouro = Column(String(255), nullable=False)
    endereco_numero = Column(String(50), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=False)
    endereco_estado = Column(String(2), nullable=False)
    endereco_regiao = Column(String(50), nullable=False)

    site_url = Column(String(255), nullable=False)
    email_contato = Column(String(255), nullable=False)
    telefone_contato = Column(String(20), nullable=False)
    
    dominio_interno = Column(String(100), unique=True, index=True, nullable=False)
    url_externa = Column(String(255), nullable=False)
    logotipo_url = Column(String(500), nullable=False)

    validade_assinatura = Column(DateTime, nullable=False)
    observacoes = Column(Text, nullable=True)
