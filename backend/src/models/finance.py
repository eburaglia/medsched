from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, ENUM
from src.database import Base
import uuid
from datetime import datetime

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    descricao = Column(String, nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    
    # 🛠️ CORREÇÃO: Ensinando o vocabulário do ENUM para o Python ler do Banco
    tipo = Column(ENUM('RECEITA', 'DESPESA', name='transactiontype', create_type=False), nullable=False)
    status = Column(ENUM('PAGO', 'PENDENTE', 'CANCELADO', 'ATRASADO', name='transactionstatus', create_type=False), nullable=False)
    metodo_pagamento = Column(ENUM('PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'BOLETO', name='paymentmethod', create_type=False), nullable=True)
    
    data_vencimento = Column(Date, nullable=False)
    data_pagamento = Column(DateTime, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    alterado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
