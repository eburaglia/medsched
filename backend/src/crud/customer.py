from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from src.models.customer import Customer, CustomerStatus
from src.schemas.customer import CustomerCreate, CustomerUpdate

def get_customer_by_id(db: Session, customer_id: UUID, tenant_id: UUID) -> Customer | None:
    return db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id
    ).first()

def get_customer_by_cpf_cnpj(db: Session, cpf_cnpj: str, tenant_id: UUID) -> Customer | None:
    return db.query(Customer).filter(
        Customer.cpf_cnpj == cpf_cnpj,
        Customer.tenant_id == tenant_id
    ).first()

def get_customers_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(Customer).filter(
        Customer.tenant_id == tenant_id
    ).order_by(Customer.nome.asc()).offset(skip).limit(limit).all()

def create_customer(db: Session, obj_in: CustomerCreate, current_user_name: str) -> Customer:
    db_obj = Customer(**obj_in.model_dump())
    db_obj.criado_por = current_user_name
    db_obj.alterado_por = current_user_name
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_customer(db: Session, db_customer: Customer, obj_in: CustomerUpdate, current_user_name: str) -> Customer:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db_customer.alterado_por = current_user_name

    # Lógica de Soft Delete
    if "status" in update_data and update_data["status"] == CustomerStatus.INATIVO:
        db_customer.deletado_em = datetime.utcnow()
        db_customer.deletado_por = current_user_name
    elif "status" in update_data and update_data["status"] == CustomerStatus.ATIVO:
        db_customer.deletado_em = None
        db_customer.deletado_por = None

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer
