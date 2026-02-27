import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, Numeric, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class AppointmentStatus(str, enum.Enum):
    PENDENTE = "pendente"
    CONFIRMADO = "confirmado"
    CONCLUIDO = "concluido"
    CANCELADO_CLIENTE = "cancelado_cliente"
    CANCELADO_PROFISSIONAL = "cancelado_profissional"
    NO_SHOW = "no_show"

class Appointment(Base):
    __tablename__ = "appointments"

    # Chave Primária
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Chaves Estrangeiras (Onde tudo se conecta)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 👇 CORREÇÃO: Agora aponta para a tabela 'customers' (nossa arquitetura multi-serviço)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Aponta para a tabela de 'users' (os funcionários/médicos)
    profissional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 👇 ATENÇÃO: Mantive as colunas, mas removi o ForeignKey() temporariamente. 
    # Faremos a amarração oficial quando criarmos os módulos de Serviços e Recursos.
    servico_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    recurso_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # O Status
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDENTE, nullable=False)
    
    # A Fotografia do Agendamento
    data_hora_inicio = Column(DateTime, nullable=False, index=True)
    data_hora_fim = Column(DateTime, nullable=False, index=True)
    
    # Deixei nullable=True temporariamente para facilitar nossos primeiros testes da API
    duracao_aplicada = Column(Integer, nullable=True) 
    preco_aplicado = Column(Numeric(10, 2), nullable=True)
    grupo_recorrencia_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Observações
    observacoes_cliente = Column(Text, nullable=True)
    observacoes_internas = Column(Text, nullable=True)

    # Auditoria (Padrão do nosso sistema)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
