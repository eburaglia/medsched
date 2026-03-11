from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from src.database import get_db
from src.schemas import finance as schemas
from src.crud import finance as crud
from src.api.deps import get_current_user, RoleChecker
from src.models.user import User
from src.models.financial_category import FinancialCategory
from src.models.payment_method import PaymentMethod
from src.models.transaction import Transaction, TransactionStatus

router = APIRouter()

# Controle de Acesso: Apenas Administradores e Gestores podem mexer no caixa da clínica
require_finance_access = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR"])

# ==========================================
# ROTAS: CATEGORIAS FINANCEIRAS
# ==========================================
@router.get("/categories", response_model=List[schemas.FinancialCategoryResponse])
def read_categories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    return crud.get_categories(db=db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)

@router.post("/categories", response_model=schemas.FinancialCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: schemas.FinancialCategoryCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    return crud.create_category(db=db, tenant_id=current_user.tenant_id, category=category, user_id=current_user.id)

@router.put("/categories/{category_id}", response_model=schemas.FinancialCategoryResponse)
def update_category(
    category_id: UUID, 
    category_in: schemas.FinancialCategoryUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    db_obj = db.query(FinancialCategory).filter(FinancialCategory.id == category_id, FinancialCategory.tenant_id == current_user.tenant_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    return crud.update_category(db=db, db_obj=db_obj, category_update=category_in, user_id=current_user.id)

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    db_obj = db.query(FinancialCategory).filter(FinancialCategory.id == category_id, FinancialCategory.tenant_id == current_user.tenant_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    crud.delete_category(db=db, db_obj=db_obj, user_id=current_user.id)
    return {"message": "Categoria inativada com sucesso"}


# ==========================================
# ROTAS: MEIOS DE PAGAMENTO
# ==========================================
@router.get("/payment-methods", response_model=List[schemas.PaymentMethodResponse])
def read_payment_methods(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    return crud.get_payment_methods(db=db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)

@router.post("/payment-methods", response_model=schemas.PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
def create_payment_method(
    method: schemas.PaymentMethodCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    return crud.create_payment_method(db=db, tenant_id=current_user.tenant_id, method=method, user_id=current_user.id)

@router.put("/payment-methods/{method_id}", response_model=schemas.PaymentMethodResponse)
def update_payment_method(
    method_id: UUID, 
    method_in: schemas.PaymentMethodUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    db_obj = db.query(PaymentMethod).filter(PaymentMethod.id == method_id, PaymentMethod.tenant_id == current_user.tenant_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Meio de pagamento não encontrado.")
    return crud.update_payment_method(db=db, db_obj=db_obj, method_update=method_in, user_id=current_user.id)

@router.delete("/payment-methods/{method_id}")
def delete_payment_method(
    method_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    db_obj = db.query(PaymentMethod).filter(PaymentMethod.id == method_id, PaymentMethod.tenant_id == current_user.tenant_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Meio de pagamento não encontrado.")
    crud.delete_payment_method(db=db, db_obj=db_obj, user_id=current_user.id)
    return {"message": "Meio de pagamento inativado com sucesso"}


# ==========================================
# ROTAS: TRANSAÇÕES (CAIXA)
# ==========================================
@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def read_transactions(
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    status: Optional[TransactionStatus] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    return crud.get_transactions(
        db=db, 
        tenant_id=current_user.tenant_id, 
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=status,
        skip=skip, 
        limit=limit
    )

@router.post("/transactions", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: schemas.TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    return crud.create_transaction(db=db, tenant_id=current_user.tenant_id, transaction=transaction, user_id=current_user.id)

@router.put("/transactions/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: UUID, 
    transaction_in: schemas.TransactionUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    db_obj = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.tenant_id == current_user.tenant_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")
    return crud.update_transaction(db=db, db_obj=db_obj, transaction_update=transaction_in, user_id=current_user.id)

@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_finance_access)
):
    db_obj = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.tenant_id == current_user.tenant_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")
    crud.delete_transaction(db=db, db_obj=db_obj, user_id=current_user.id)
    return {"message": "Transação cancelada com sucesso"}
