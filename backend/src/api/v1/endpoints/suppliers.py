from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.models.supplier import Supplier
from src.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from src.api.deps import get_current_user
from src.models.user import User

router = APIRouter(prefix="/suppliers", tags=["Fornecedores"])

@router.get("/", response_model=List[SupplierResponse])
def listar_fornecedores(tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Supplier).filter(Supplier.tenant_id == tenant_id).all()

@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def criar_fornecedor(obj_in: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = Supplier(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=SupplierResponse)
def atualizar_fornecedor(id: UUID, obj_in: SupplierUpdate, tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Supplier).filter(Supplier.id == id, Supplier.tenant_id == tenant_id).first()
    if not db_obj: raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
    
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}")
def eliminar_fornecedor(id: UUID, tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Supplier).filter(Supplier.id == id, Supplier.tenant_id == tenant_id).first()
    if not db_obj: raise HTTPException(status_code=404)
    db.delete(db_obj)
    db.commit()
    return {"status": "sucesso"}
