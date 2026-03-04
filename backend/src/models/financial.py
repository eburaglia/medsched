import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, Date, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

class TransactionType(str, enum.Enum):
    RECEITA = "receita"
    DESPESA = "despesa"

class TransactionStatus(str, enum.Enum):
    PENDENTE = "pendente"   # O "Previsto"
    PAGO = "pago"           # O "Realizado"
    CANCELADO = "cancelado"
    ATRASADO = "atrasado"

class PaymentMethod(str, enum.Enum):
    PIX = "pix"
    CARTAO_CREDITO = "cartao_credito"
    CARTAO_DEBITO = "cartao_debito"
    DINHEIRO = "dinheiro"
    CONVENIO = "convenio"
    OUTRO = "outro"

class FinancialTransaction(Base):
    """
    Modelo de Transações Financeiras (Contas a Receber / Contas a Pagar).
    """
    __tablename__ = "financial_transactions"

    # Chave Primária
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Rastreabilidade Multi-Tenant (Obrigatório)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Rastreabilidade de Origem (Opcionais, pois uma despesa de luz não tem paciente)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)

    # Dados Financeiros
    descricao = Column(String, nullable=False)
    valor = Column(Numeric(10, 2), nullable=False) # Ex: 99999999.99
    
    # Classificações
    tipo = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDENTE, nullable=False)
    metodo_pagamento = Column(Enum(PaymentMethod), nullable=True)

    # Datas (Vencimento = Previsto | Pagamento = Realizado)
    data_vencimento = Column(Date, nullable=False)
    data_pagamento = Column(DateTime, nullable=True)

    # Auditoria
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
