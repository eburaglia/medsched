from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from database import get_db
from models.finance import FinancialTransaction
from schemas.finance import TransactionCreate, TransactionResponse

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(tenant_id: UUID, db: Session = Depends(get_db)):
    return db.query(FinancialTransaction).filter(FinancialTransaction.tenant_id == tenant_id).order_by(FinancialTransaction.data_vencimento.desc()).all()

@router.post("/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = FinancialTransaction(
        **transaction.dict(),
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
        raise HTTPException(status_code=400, detail=str(e))
