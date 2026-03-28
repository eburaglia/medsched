from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from src.database import get_db
from src.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from src.crud import customer as crud_customer
from src.api.deps import get_current_user
from src.models.user import User
from src.utils.notification_trigger import NotificationTrigger

router = APIRouter(prefix="/customers", tags=["Clientes"])

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(obj_in: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = crud_customer.create_customer(db, obj_in=obj_in, current_user_id=current_user.id)
    
    # 👇 DRCODE: Dispara Boas-vindas (Use o código exato do seu template)
    try:
        # Se o seu template de boas-vindas tiver o código 'welcome_customer'
        # Ajuste o nome abaixo para o 'codigo_interno' que você deu ao template na tela
        NotificationTrigger.trigger_appointment_event(db, customer.id, "welcome_customer")
    except: pass
    
    return customer

# ... (restante das rotas de GET, PUT, DELETE permanecem iguais)
