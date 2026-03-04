from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.service_record import ServiceRecordCreate, ServiceRecordUpdate, ServiceRecordResponse
from src.crud import service_record as crud_service_record
from src.api.deps import get_current_user
from src.models.user import User

router = APIRouter(
    prefix="/service-records",
    tags=["Registros de Serviço (Prontuário/Fichas)"]
)

@router.post("/", response_model=ServiceRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    record_in: ServiceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo registro de atendimento (Evolução/Ficha)."""
    if str(current_user.tenant_id) != str(record_in.tenant_id):
        raise HTTPException(status_code=403, detail="Permissão negada para esta clínica.")
    
    return crud_service_record.create_service_record(db=db, obj_in=record_in)

@router.get("/customer/{customer_id}", response_model=List[ServiceRecordResponse])
def read_customer_history(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna todo o histórico de atendimentos de um cliente específico."""
    return crud_service_record.get_records_by_customer(
        db=db, 
        tenant_id=current_user.tenant_id, 
        customer_id=customer_id
    )

@router.put("/{record_id}", response_model=ServiceRecordResponse)
def update_record(
    record_id: UUID,
    record_in: ServiceRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um registro ou o assina eletronicamente (travando edições)."""
    db_obj = crud_service_record.get_record_by_id(db=db, record_id=record_id, tenant_id=current_user.tenant_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Registro não encontrado.")
        
    return crud_service_record.update_service_record(db=db, db_obj=db_obj, obj_in=record_in)
