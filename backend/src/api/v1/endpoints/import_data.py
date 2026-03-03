import pandas as pd
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID

from src.database import get_db
from src.models.import_staging import ImportEntityType
from src.schemas.import_staging import ImportBatchResponse, ImportBatchCreate
from src.crud import import_staging as crud_import
from src.api.deps import get_current_user
from src.models.user import User

# ---------------------------------------------------------
# 🚦 CONFIGURAÇÃO DO ROTEADOR
# ---------------------------------------------------------
router = APIRouter(
    prefix="/import",
    tags=["Importação de Dados (ETL)"]
)

# ---------------------------------------------------------
# 📤 ENDPOINT: UPLOAD DE ARQUIVO (EXCEL/CSV)
# ---------------------------------------------------------
@router.post("/upload", response_model=ImportBatchResponse, status_code=status.HTTP_201_CREATED)
async def upload_import_file(
    # Diferente do JSON comum, aqui usamos Form() para receber texto junto com um Arquivo
    entity_type: ImportEntityType = Form(..., description="O que tem nessa planilha? (customer, service, etc)"),
    file: UploadFile = File(..., description="Arquivo .xlsx ou .csv"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recebe uma planilha da clínica, lê o conteúdo e salva na Staging Area para validação posterior.
    """
    # 1. Trava de segurança da extensão
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="Apenas arquivos .xlsx ou .csv são permitidos.")

    # 2. Ler o arquivo diretamente na memória da API
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler o arquivo: {str(e)}. Verifique se a planilha é válida.")

    # 3. Limpeza Rápida: Substituir células vazias (NaN) por texto vazio para não quebrar o JSON
    df = df.fillna("")

    # 4. Converter a planilha em uma lista de dicionários Python
    rows_data = df.to_dict(orient="records")

    if not rows_data:
        raise HTTPException(status_code=400, detail="A planilha está vazia.")

    # 5. Criar o Cabeçalho (Batch)
    batch_in = ImportBatchCreate(
        entity_type=entity_type,
        file_name=file.filename,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    batch = crud_import.create_import_batch(db=db, obj_in=batch_in)

    # 6. Salvar as Linhas (Rows) no Banco
    crud_import.create_import_rows(db=db, batch_id=batch.id, rows_data=rows_data)

    return batch

# ---------------------------------------------------------
# 🕵️ ENDPOINT: VALIDAR LOTE (O BOTÃO DO ADMIN)
# ---------------------------------------------------------
@router.post("/{batch_id}/validate", response_model=ImportBatchResponse)
def validate_import_batch(
    batch_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Inspeciona todas as linhas de um arquivo importado.
    Corrige formatações, valida regras (ex: e-mail duplicado) e prepara para a importação final.
    """
    batch = crud_import.validate_import_batch(db=db, batch_id=batch_id, tenant_id=current_user.tenant_id)
    
    if not batch:
        raise HTTPException(status_code=404, detail="Lote de importação não encontrado ou você não tem permissão.")
        
    return batch

# ---------------------------------------------------------
# 🚀 ENDPOINT: PROMOVER LOTE (IMPORTAÇÃO DEFINITIVA) - NOVO!
# ---------------------------------------------------------
@router.post("/{batch_id}/promote")
def promote_import_batch(
    batch_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Promove as linhas validadas para a tabela oficial do sistema (Ex: Clientes).
    Após o sucesso, a Staging Area é limpa fisicamente para economizar espaço.
    """
    success, count = crud_import.promote_import_batch(db=db, batch_id=batch_id, tenant_id=current_user.tenant_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Lote não encontrado ou não está com status WAITING_APPROVAL (Aguardando Aprovação)."
        )
        
    return {
        "status": "sucesso",
        "mensagem": f"Importação concluída! {count} registros foram salvos na base oficial.",
        "registros_importados": count
    }
