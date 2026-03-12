from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from src.database import get_db
from src.models.finance import FinancialTransaction
from src.schemas.finance import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(tenant_id: UUID, db: Session = Depends(get_db)):
    return db.query(FinancialTransaction).filter(
        FinancialTransaction.tenant_id == tenant_id
    ).order_by(FinancialTransaction.data_vencimento.desc()).all()

@router.post("/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = FinancialTransaction(
        **transaction.model_dump() if hasattr(transaction, 'model_dump') else transaction.dict(),
        criado_em=datetime.utcnow(),
        alterado_em=datetime.utcnow()
    )
    db.add(db_transaction)
    try:
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar: {str(e)}")

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: UUID, transaction: TransactionUpdate, db: Session = Depends(get_db)):
    db_transaction = db.query(FinancialTransaction).filter(FinancialTransaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # exclude_unset=True garante que só vamos atualizar o que o React enviou (ideal para a edição em lote)
    update_data = transaction.model_dump(exclude_unset=True) if hasattr(transaction, 'model_dump') else transaction.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
        
    db_transaction.alterado_em = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar: {str(e)}")

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: UUID, db: Session = Depends(get_db)):
    db_transaction = db.query(FinancialTransaction).filter(FinancialTransaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
        
    try:
        db.delete(db_transaction)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir: {str(e)}")
