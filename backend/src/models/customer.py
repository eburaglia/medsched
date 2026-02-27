import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class Customer(Base):
    """
    Modelo de Cliente (Agnóstico a serviço).
    Pode representar o paciente de uma clínica, o aluno de um estúdio ou o cliente de um escritório.
    """
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Chave estrangeira para garantir o isolamento Multi-Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Dados Pessoais / Cadastrais
    nome = Column(String(255), nullable=False, index=True)
    cpf_cnpj = Column(String(20), nullable=True) # Flexível para PF ou PJ
    data_nascimento = Column(Date, nullable=True) # Ou data de fundação
    genero = Column(String(50), nullable=True)
    
    # Contato
    telefone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Endereço
    endereco_logradouro = Column(String(255), nullable=True)
    endereco_numero = Column(String(50), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)
    endereco_cep = Column(String(20), nullable=True)
    
    # Histórico / Observações Gerais
    observacoes = Column(Text, nullable=True)

    # Auditoria
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
