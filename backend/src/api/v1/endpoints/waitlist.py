from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from src.database import get_db
from src.schemas import waitlist as schemas
from src.crud import waitlist as crud
from src.api.deps import get_current_user, RoleChecker
from src.models.user import User

router = APIRouter()

# ------------------------------------------------------------------
# RBAC (Role-Based Access Control)
# ------------------------------------------------------------------
# Clientes também podem se colocar na fila
require_acesso_fila = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR", "PROFISSIONAL", "CLIENTE"])
# Apenas a equipe da clínica pode gerenciar e ver a fila inteira
require_gestao_fila = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR", "PROFISSIONAL"])

@router.post("/", response_model=schemas.WaitlistResponse, status_code=status.HTTP_201_CREATED)
def create_waitlist_entry(
    entry: schemas.WaitlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_acesso_fila)
):
    # Blindagem: Garante que o usuário só crie fila para a sua própria clínica
    papel = current_user.papel.value if hasattr(current_user.papel, 'value') else current_user.papel
    if papel not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        if current_user.tenant_id != entry.tenant_id:
            raise HTTPException(status_code=403, detail="Acesso negado. Você não pertence a esta clínica.")

    return crud.create_waitlist_entry(db=db, entry=entry, current_user_id=current_user.id)

@router.get("/", response_model=List[schemas.WaitlistResponse])
def read_waitlist(
    status: Optional[str] = None,
    professional_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_gestao_fila)
):
    # A equipe só vê a fila da própria clínica
    return crud.get_waitlist_entries(
        db=db, 
        tenant_id=current_user.tenant_id, 
        status=status, 
        professional_id=professional_id, 
        skip=skip, 
        limit=limit
    )

@router.put("/{entry_id}", response_model=schemas.WaitlistResponse)
def update_waitlist_entry(
    entry_id: UUID,
    update_data: schemas.WaitlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_gestao_fila)
):
    db_entry = crud.get_waitlist_entry(db=db, entry_id=entry_id, tenant_id=current_user.tenant_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Registro não encontrado na fila de espera.")

    return crud.update_waitlist_entry(db=db, db_entry=db_entry, update_data=update_data, current_user_id=current_user.id)
