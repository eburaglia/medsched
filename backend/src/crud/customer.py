from sqlalchemy.orm import Session
from uuid import UUID

from src.models.customer import Customer
from src.schemas.customer import CustomerCreate, CustomerUpdate

def get_customer_by_id(db: Session, customer_id: UUID, tenant_id: UUID) -> Customer | None:
    """
    Busca um cliente específico pelo ID.
    Regra de ouro: Sempre filtra pelo tenant_id para garantir isolamento!
    """
    return db.query(Customer).filter(
        Customer.id == customer_id, 
        Customer.tenant_id == tenant_id
    ).first()

def get_customer_by_cpf_cnpj(db: Session, cpf_cnpj: str, tenant_id: UUID) -> Customer | None:
    """
    Busca um cliente pelo CPF/CNPJ dentro da mesma clínica/empresa.
    Útil para evitar cadastros duplicados no mesmo tenant.
    """
    return db.query(Customer).filter(
        Customer.cpf_cnpj == cpf_cnpj, 
        Customer.tenant_id == tenant_id
    ).first()

def get_customers_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100):
    """
    Lista os clientes de uma empresa específica (com paginação).
    """
    return db.query(Customer).filter(
        Customer.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def create_customer(db: Session, obj_in: CustomerCreate) -> Customer:
    """
    Recebe os dados validados do Pydantic, transforma no modelo do SQLAlchemy 
    e salva no banco de dados.
    """
    # model_dump() converte o schema Pydantic num dicionário do Python
    db_obj = Customer(**obj_in.model_dump())
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    return db_obj

def update_customer(db: Session, db_customer: Customer, obj_in: CustomerUpdate) -> Customer:
    """
    Atualiza apenas os campos que foram enviados na requisição (exclude_unset=True).
    """
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_customer, field, value)
        
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return db_customer
