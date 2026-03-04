from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Optional

from src.models.financial import FinancialTransaction, TransactionStatus
from src.schemas.financial import FinancialTransactionCreate, FinancialTransactionUpdate

def create_transaction(db: Session, obj_in: FinancialTransactionCreate) -> FinancialTransaction:
    """Cria uma nova transação financeira (Receita ou Despesa)."""
    db_obj = FinancialTransaction(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_transactions_by_tenant(
    db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100
) -> List[FinancialTransaction]:
    """Retorna o fluxo de caixa da clínica (todas as transações)."""
    return db.query(FinancialTransaction).filter(
        FinancialTransaction.tenant_id == tenant_id
    ).order_by(FinancialTransaction.data_vencimento.desc()).offset(skip).limit(limit).all()

def get_transaction_by_id(db: Session, transaction_id: UUID, tenant_id: UUID) -> Optional[FinancialTransaction]:
    """Busca uma transação específica garantindo o isolamento do tenant."""
    return db.query(FinancialTransaction).filter(
        FinancialTransaction.id == transaction_id,
        FinancialTransaction.tenant_id == tenant_id
    ).first()

def update_transaction(
    db: Session, db_obj: FinancialTransaction, obj_in: FinancialTransactionUpdate
) -> FinancialTransaction:
    """Atualiza a transação. Se mudar para PAGO, registra a data."""
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # Regra de Negócio Automática: Se a clínica marcou como PAGO agora...
    if update_data.get("status") == TransactionStatus.PAGO and db_obj.status != TransactionStatus.PAGO:
        if not update_data.get("data_pagamento"):
            update_data["data_pagamento"] = datetime.utcnow()

    for field in update_data:
        setattr(db_obj, field, update_data[field])

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
