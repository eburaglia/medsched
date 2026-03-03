from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime
from uuid import UUID

from src.models.import_staging import ImportEntityType, ImportBatchStatus, ImportRowStatus

# --- SCHEMAS PARA O LOTE (BATCH) ---

class ImportBatchBase(BaseModel):
    entity_type: ImportEntityType
    file_name: str
    tenant_id: UUID
    user_id: UUID

class ImportBatchCreate(ImportBatchBase):
    pass

class ImportBatchResponse(ImportBatchBase):
    id: UUID
    status: ImportBatchStatus
    criado_em: datetime
    alterado_em: datetime
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS PARA AS LINHAS (ROWS) ---

class ImportRowBase(BaseModel):
    batch_id: UUID
    row_number: int
    raw_data: Dict[str, Any]  # O dicionário genérico que vai para o JSONB

class ImportRowCreate(ImportRowBase):
    pass

class ImportRowResponse(ImportRowBase):
    id: UUID
    status: ImportRowStatus
    error_message: Optional[str] = None
    criado_em: datetime
    alterado_em: datetime
    model_config = ConfigDict(from_attributes=True)
