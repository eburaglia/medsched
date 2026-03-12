from sqlalchemy import Column, String, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, ENUM
from src.database import Base
import uuid
from datetime import datetime

# 1. Tabela de Regras de Maquininha/Banco
class PaymentFee(Base):
    __tablename__ = "payment_fees"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Reutilizamos o ENUM exato que já existe no seu banco!
    metodo_pagamento = Column(ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'CONVENIO', 'OUTRO', 'TRANSFERENCIA', 'BOLETO', name='paymentmethod', create_type=False), nullable=False)
    
    tipo_taxa = Column(String, nullable=False) # 'PERCENTUAL' ou 'FIXO'
    valor_taxa = Column(Numeric(10, 2), default=0.00)
    
    # Se True: Soma no preço do serviço (Ex: 100 + 5% = 105). 
    # Se False: Mantém o preço (100) mas o relatório financeiro avisa que o lucro líquido é 95.
    repassar_ao_cliente = Column(Boolean, default=True) 

# 2. Tabela de Convênios / Parcerias / Contratos
class Agreement(Base):
    __tablename__ = "agreements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    nome = Column(String, nullable=False) # Ex: Unimed, Porto Seguro, Gympass
    ativo = Column(Boolean, default=True)

# 3. Tabela de Preços Diferenciados (Substituição de Preço)
class ServiceAgreementPrice(Base):
    __tablename__ = "service_agreement_prices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    agreement_id = Column(UUID(as_uuid=True), ForeignKey("agreements.id", ondelete="CASCADE"), nullable=False, index=True)
    
    valor_acordado = Column(Numeric(10, 2), nullable=False) # O preço "especial" cravado
