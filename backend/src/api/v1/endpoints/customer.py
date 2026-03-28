from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from src.database import get_db
from src.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from src.crud import customer as crud_customer
from src.api.deps import get_current_user
from src.models.user import User
from src.utils.notification_trigger import NotificationTrigger

router = APIRouter(
    prefix="/customers",
    tags=["Clientes"]
)

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validação de Tenant
    if str(current_user.tenant_id) != str(customer_in.tenant_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")

    # Validação de CPF/CNPJ Duplicado
    if customer_in.cpf_cnpj:
        existing_customer = crud_customer.get_customer_by_cpf_cnpj(db=db, cpf_cnpj=customer_in.cpf_cnpj, tenant_id=customer_in.tenant_id)
        if existing_customer:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF/CNPJ já cadastrado nesta clínica.")

    # Criação do cliente
    customer = crud_customer.create_customer(db=db, obj_in=customer_in, current_user_name=current_user.nome)
    
    # 👇 GATILHO DE NOTIFICAÇÃO (WhatsApp/Telegram Boas-vindas)
    try:
        NotificationTrigger.trigger_appointment_event(db, customer.id, "welcome_customer")
    except Exception as e:
        print(f"Erro ao disparar welcome_customer: {e}")
        pass
        
    return customer

@router.get("/", response_model=List[CustomerResponse])
def read_customers(
    tenant_id: str, # Recebemos como string para evitar 422 caso venha 'undefined'
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Proteção de acesso: usuário só vê dados do seu próprio tenant
    if tenant_id == "undefined" or str(current_user.tenant_id) != tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    
    return crud_customer.get_customers_by_tenant(
        db=db, 
        tenant_id=UUID(tenant_id), 
        skip=skip, 
        limit=limit
    )

@router.get("/{customer_id}", response_model=CustomerResponse)
def read_customer(
    customer_id: UUID,
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    
    customer = crud_customer.get_customer_by_id(db=db, customer_id=customer_id, tenant_id=tenant_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: UUID,
    tenant_id: UUID,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    
    customer = crud_customer.get_customer_by_id(db=db, customer_id=customer_id, tenant_id=tenant_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    
    return crud_customer.update_customer(
        db=db, 
        db_customer=customer, 
        obj_in=customer_in, 
        current_user_name=current_user.nome
    )
