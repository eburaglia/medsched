import enum
from sqlalchemy import Column, String, Integer, Text, DateTime, Enum, Identity
from src.database import Base
from src.models.base import AuditoriaMixin

# Definindo o Domínio de Valores (ENUM) para o Status
class TenantStatus(str, enum.Enum):
    PHASE_IN = "phase-in"
    ATIVO = "ativo"
    PHASE_OUT = "phase-out"
    INATIVO = "inativo"

# A Classe Tenant herda a AuditoriaMixin (ID, criado_em, etc) e a Base (SQLAlchemy)
class Tenant(AuditoriaMixin, Base):
    __tablename__ = "tenants"

    # Identificador amigável de auto-incremento para humanos e relatórios.
    # Utilizando Identity nativo do PostgreSQL iniciando em 10000 para aspecto profissional.
    codigo_visual = Column(
        Integer, 
        Identity(start=10000, cycle=False), 
        unique=True, 
        index=True, 
        nullable=False
    )
    
    # Status com trava de segurança via Enum
    status = Column(Enum(TenantStatus), default=TenantStatus.PHASE_IN, nullable=False)
    
    # Dados Principais
    nome = Column(String(255), nullable=False)
    nome_fantasia = Column(String(255), nullable=True)
    cnpj = Column(String(20), unique=True, index=True, nullable=True) # Impede CNPJ duplicado
    segmento_atuacao = Column(String(100), nullable=False)
    fuso_horario = Column(String(50), nullable=False)

    # Endereço (Atomizado na Primeira Forma Normal, como planejamos)
    endereco_logradouro = Column(String(255), nullable=False)
    endereco_cidade = Column(String(100), nullable=False)
    endereco_estado = Column(String(2), nullable=False)
    endereco_regiao = Column(String(50), nullable=False)

    # Contato e Web
    site_url = Column(String(255), nullable=False)
    email_contato = Column(String(255), nullable=False)
    telefone_contato = Column(String(20), nullable=False)
    
    # Domínio interno único (ex: clinica-vida) para criar URLs personalizadas
    dominio_interno = Column(String(100), unique=True, index=True, nullable=False)
    url_externa = Column(String(255), nullable=False)
    logotipo_url = Column(String(500), nullable=False)

    # Regras de Negócio e Assinatura
    validade_assinatura = Column(DateTime, nullable=False)
    observacoes = Column(Text, nullable=True)
