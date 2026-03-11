from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import Optional

from src.models.financial_category import FinancialCategory
from src.models.payment_method import PaymentMethod
from src.models.transaction import Transaction, TransactionStatus
from src.schemas import finance as schemas

# ==========================================
# CATEGORIAS FINANCEIRAS
# ==========================================
def get_categories(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(FinancialCategory).filter(
        FinancialCategory.tenant_id == tenant_id,
        FinancialCategory.deletado_em == None
    ).order_by(FinancialCategory.nome.asc()).offset(skip).limit(limit).all()

def create_category(db: Session, tenant_id: UUID, category: schemas.FinancialCategoryCreate, user_id: UUID):
    db_obj = FinancialCategory(**category.model_dump(), tenant_id=tenant_id)
    db_obj.criado_por = user_id
    db_obj.alterado_por = user_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_category(db: Session, db_obj: FinancialCategory, category_update: schemas.FinancialCategoryUpdate, user_id: UUID):
    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db_obj.alterado_por = user_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_category(db: Session, db_obj: FinancialCategory, user_id: UUID):
    db_obj.deletado_em = datetime.utcnow()
    db_obj.deletado_por = user_id
    db_obj.ativo = False
    db.add(db_obj)
    db.commit()
    return db_obj

# ==========================================
# MEIOS DE PAGAMENTO
# ==========================================
def get_payment_methods(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(PaymentMethod).filter(
        PaymentMethod.tenant_id == tenant_id,
        PaymentMethod.deletado_em == None
    ).order_by(PaymentMethod.nome.asc()).offset(skip).limit(limit).all()

def create_payment_method(db: Session, tenant_id: UUID, method: schemas.PaymentMethodCreate, user_id: UUID):
    db_obj = PaymentMethod(**method.model_dump(), tenant_id=tenant_id)
    db_obj.criado_por = user_id
    db_obj.alterado_por = user_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_payment_method(db: Session, db_obj: PaymentMethod, method_update: schemas.PaymentMethodUpdate, user_id: UUID):
    update_data = method_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db_obj.alterado_por = user_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_payment_method(db: Session, db_obj: PaymentMethod, user_id: UUID):
    db_obj.deletado_em = datetime.utcnow()
    db_obj.deletado_por = user_id
    db_obj.ativo = False
    db.add(db_obj)
    db.commit()
    return db_obj

# ==========================================
# TRANSAÇÕES (O Fluxo de Caixa)
# ==========================================
def get_transactions(
    db: Session, 
    tenant_id: UUID, 
    data_inicio: Optional[datetime] = None, 
    data_fim: Optional[datetime] = None,
    status: Optional[TransactionStatus] = None,
    skip: int = 0, 
    limit: int = 100
):
    query = db.query(Transaction).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.deletado_em == None
    )
    
    if data_inicio:
        query = query.filter(Transaction.data_vencimento >= data_inicio)
    if data_fim:
        query = query.filter(Transaction.data_vencimento <= data_fim)
    if status:
        query = query.filter(Transaction.status == status)
        
    return query.order_by(Transaction.data_vencimento.desc()).offset(skip).limit(limit).all()

def create_transaction(db: Session, tenant_id: UUID, transaction: schemas.TransactionCreate, user_id: UUID):
    db_obj = Transaction(**transaction.model_dump(), tenant_id=tenant_id)
    db_obj.criado_por = user_id
    db_obj.alterado_por = user_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_transaction(db: Session, db_obj: Transaction, transaction_update: schemas.TransactionUpdate, user_id: UUID):
    update_data = transaction_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db_obj.alterado_por = user_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_transaction(db: Session, db_obj: Transaction, user_id: UUID):
    db_obj.deletado_em = datetime.utcnow()
    db_obj.deletado_por = user_id
    db_obj.status = TransactionStatus.CANCELADO
    db.add(db_obj)
    db.commit()
    return db_obj
