import pandas as pd
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from uuid import UUID

from src.database import get_db
from src.models.import_staging import ImportEntityType, ImportBatch, ImportRow
from src.schemas.import_staging import ImportBatchResponse, ImportBatchCreate
from src.crud import import_staging as crud_import
from src.api.deps import get_current_user
from src.models.user import User

router = APIRouter(prefix="/import", tags=["Importação de Dados (ETL)"])

@router.get("/batches")
def get_import_batches(tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batches = db.query(ImportBatch).filter(ImportBatch.tenant_id == tenant_id).order_by(ImportBatch.criado_em.desc()).all()
    return JSONResponse(content=jsonable_encoder(batches))

# 👇 DRCODE: Rota ajustada para /batch/{batch_id} para casar com o Frontend
@router.delete("/batch/{batch_id}")
def delete_import_batch(batch_id: UUID, tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id, ImportBatch.tenant_id == tenant_id).first()
    if not batch: raise HTTPException(status_code=404, detail="Lote não encontrado")
    db.delete(batch)
    db.commit()
    return {"status": "success"}

@router.post("/upload", response_model=ImportBatchResponse, status_code=status.HTTP_201_CREATED)
async def upload_import_file(
    tenant_id: UUID, 
    entity_type: ImportEntityType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="Apenas .xlsx ou .csv são permitidos.")

    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler o arquivo: {str(e)}")

    df = df.fillna("")
    rows_data = df.to_dict(orient="records")

    if not rows_data:
        raise HTTPException(status_code=400, detail="A planilha está vazia.")

    batch_in = ImportBatchCreate(
        entity_type=entity_type,
        file_name=file.filename,
        tenant_id=tenant_id, 
        user_id=current_user.id
    )
    batch = crud_import.create_import_batch(db=db, obj_in=batch_in)
    crud_import.create_import_rows(db=db, batch_id=batch.id, rows_data=rows_data)

    return batch

@router.post("/validate/{batch_id}", response_model=ImportBatchResponse)
def validate_import_batch(batch_id: UUID, tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = crud_import.validate_import_batch(db=db, batch_id=batch_id, tenant_id=tenant_id)
    if not batch: raise HTTPException(status_code=404, detail="Lote não encontrado.")
    return batch

@router.post("/promote/{batch_id}")
def promote_import_batch(batch_id: UUID, tenant_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success, count = crud_import.promote_import_batch(db=db, batch_id=batch_id, tenant_id=tenant_id)
    if not success: raise HTTPException(status_code=400, detail="Lote inválido ou já processado.")
    return {"status": "sucesso", "mensagem": f"Importação concluída! {count} registros salvos.", "registros_importados": count}

@router.get("/{batch_id}/rows")
def get_import_rows(batch_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(ImportRow).filter(ImportRow.batch_id == batch_id).order_by(ImportRow.row_number).all()
    return JSONResponse(content=jsonable_encoder([{"id": r.id, "row_number": r.row_number, "raw_data": r.raw_data, "status": r.status.value if hasattr(r.status, 'value') else r.status, "error_message": r.error_message} for r in rows]))

@router.put("/rows/{row_id}")
def update_import_row(row_id: UUID, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.query(ImportRow).filter(ImportRow.id == row_id).first()
    if not row: raise HTTPException(status_code=404, detail="Linha não encontrada.")
    row.raw_data = payload
    row.status = "pending"
    row.error_message = None
    db.commit()
    return {"status": "success"}

@router.delete("/rows/{row_id}")
def delete_import_row(row_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.query(ImportRow).filter(ImportRow.id == row_id).first()
    if not row: raise HTTPException(status_code=404)
    db.delete(row)
    db.commit()
    return {"status": "success"}
