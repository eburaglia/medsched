from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.schemas.holiday import HolidayCreate, HolidayUpdate, HolidayResponse
from src.crud import holiday as crud_holiday
from src.api.deps import get_current_user, RoleChecker
from src.models.user import User

router = APIRouter()

# Gestores e Admins podem criar/editar
require_admin_or_tenant = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR"])
# Profissionais também podem ver a lista de feriados
require_staff = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR", "PROFISSIONAL"])

def verify_tenant_access(current_user: User, target_tenant_id: UUID):
    if current_user.papel in ["SUPER_ADMIN", "SYSTEM_ADMIN"]: return True
    if str(current_user.tenant_id) != str(target_tenant_id):
        raise HTTPException(status_code=403, detail="Acesso negado.")

@router.post("/", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(holiday_in: HolidayCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_tenant)):
    verify_tenant_access(current_user, holiday_in.tenant_id)
    return crud_holiday.create_holiday(db=db, obj_in=holiday_in)

@router.get("/", response_model=List[HolidayResponse])
def read_holidays(tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    verify_tenant_access(current_user, tenant_id)
    return crud_holiday.get_holidays_by_tenant(db=db, tenant_id=tenant_id)

@router.put("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(holiday_id: UUID, tenant_id: UUID, holiday_in: HolidayUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_tenant)):
    verify_tenant_access(current_user, tenant_id)
    holiday = crud_holiday.get_holiday_by_id(db=db, holiday_id=holiday_id, tenant_id=tenant_id)
    if not holiday: raise HTTPException(status_code=404, detail="Feriado não encontrado.")
    return crud_holiday.update_holiday(db=db, db_obj=holiday, obj_in=holiday_in)

@router.delete("/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(holiday_id: UUID, tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_tenant)):
    verify_tenant_access(current_user, tenant_id)
    holiday = crud_holiday.get_holiday_by_id(db=db, holiday_id=holiday_id, tenant_id=tenant_id)
    if not holiday: raise HTTPException(status_code=404, detail="Feriado não encontrado.")
    crud_holiday.delete_holiday(db=db, db_obj=holiday)
