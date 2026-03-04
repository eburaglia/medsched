from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.financial import FinancialTransactionCreate, FinancialTransactionUpdate, FinancialTransactionResponse
from src.crud import financial as crud_financial
from src.api.deps import get_current_user
from src.models.user import User

router = APIRouter(
    prefix="/financial",
    tags=["Financeiro (Fluxo de Caixa / Contas)"]
)

@router.post("/", response_model=FinancialTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_in: FinancialTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lança uma nova Conta a Receber (Receita) ou a Pagar (Despesa)."""
    if str(current_user.tenant_id) != str(transaction_in.tenant_id):
        raise HTTPException(status_code=403, detail="Acesso negado para este Tenant.")
    
    return crud_financial.create_transaction(db=db, obj_in=transaction_in)

@router.get("/", response_model=List[FinancialTransactionResponse])
def read_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todo o fluxo de caixa (Entradas e Saídas) da clínica."""
    return crud_financial.get_transactions_by_tenant(
        db=db, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )

@router.put("/{transaction_id}", response_model=FinancialTransactionResponse)
def update_transaction(
    transaction_id: UUID,
    transaction_in: FinancialTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma transação (ex: muda de PENDENTE para PAGO)."""
    db_obj = crud_financial.get_transaction_by_id(db=db, transaction_id=transaction_id, tenant_id=current_user.tenant_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")
        
    return crud_financial.update_transaction(db=db, db_obj=db_obj, obj_in=transaction_in)
