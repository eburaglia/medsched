from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID
from pydantic import ValidationError

from src.models.import_staging import ImportBatch, ImportRow, ImportBatchStatus, ImportRowStatus, ImportEntityType
from src.schemas.import_staging import ImportBatchCreate
from src.models.customer import Customer
from src.schemas.customer import CustomerCreate
from src.models.holiday import Holiday
from src.schemas.holiday import HolidayCreate

def create_import_batch(db: Session, obj_in: ImportBatchCreate) -> ImportBatch:
    db_obj = ImportBatch(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def create_import_rows(db: Session, batch_id: UUID, rows_data: List[Dict[str, Any]]):
    import_rows = [ImportRow(batch_id=batch_id, row_number=index + 2, raw_data=row_dict) for index, row_dict in enumerate(rows_data)]
    db.add_all(import_rows)
    db.commit()

def validate_import_batch(db: Session, batch_id: UUID, tenant_id: UUID) -> ImportBatch | None:
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id, ImportBatch.tenant_id == tenant_id).first()
    if not batch: return None

    batch.status = ImportBatchStatus.PROCESSING
    db.commit()

    rows = db.query(ImportRow).filter(ImportRow.batch_id == batch_id).all()

    for row in rows:
        raw = row.raw_data
        raw_lower = {str(k).strip().lower(): v for k, v in raw.items()}
        
        if batch.entity_type == ImportEntityType.CUSTOMER:
            raw_nome = raw_lower.get("nome", "")
            raw_email = raw_lower.get("email") or raw_lower.get("e-mail") or ""
            raw_telefone = raw_lower.get("telefone") or raw_lower.get("celular") or ""
            raw_cpf_cnpj = raw_lower.get("cpf_cnpj") or raw_lower.get("cpf") or raw_lower.get("cnpj") or ""

            normalized_data = {"nome": str(raw_nome).strip(), "tenant_id": tenant_id}
            if str(raw_email).strip(): normalized_data["email"] = str(raw_email).strip()
            if str(raw_telefone).strip(): normalized_data["telefone"] = str(raw_telefone).strip()
            if str(raw_cpf_cnpj).strip(): normalized_data["cpf_cnpj"] = str(raw_cpf_cnpj).strip()

            try:
                customer_in = CustomerCreate(**normalized_data)
                
                # 👇 DRCODE: Blindagem Definitiva
                has_email = bool(customer_in.email)
                has_cpf = bool(getattr(customer_in, 'cpf_cnpj', None))
                
                if not has_email and not has_cpf:
                    row.status = ImportRowStatus.INVALID
                    row.error_message = "Obrigatório preencher E-mail ou CPF/CNPJ para evitar cadastros duplicados."
                    db.add(row)
                    continue

                duplicate_errors = []
                if has_email:
                    if db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.email == customer_in.email).first():
                        duplicate_errors.append(f"E-mail '{customer_in.email}' já existe")
                        
                if has_cpf:
                    if db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.cpf_cnpj == customer_in.cpf_cnpj).first():
                        duplicate_errors.append(f"CPF/CNPJ '{customer_in.cpf_cnpj}' já existe")

                if duplicate_errors:
                    row.status = ImportRowStatus.DUPLICATED
                    row.error_message = " | ".join(duplicate_errors)
                    db.add(row)
                    continue

                row.status = ImportRowStatus.VALID
                row.error_message = None
                row.raw_data = customer_in.model_dump(mode="json", exclude_unset=True) 

            except ValidationError as e:
                row.status = ImportRowStatus.INVALID
                errors = [f"Campo '{err['loc'][0]}': {err['msg']}" for err in e.errors()]
                row.error_message = " | ".join(errors)
            
            db.add(row)

        elif batch.entity_type == ImportEntityType.HOLIDAY:
            raw_nome = raw_lower.get("nome", "")
            raw_data = raw_lower.get("data", "")
            raw_tipo = raw_lower.get("tipo", "FEDERAL")
            raw_expediente = raw_lower.get("havera_expediente") or raw_lower.get("expediente") or False

            if isinstance(raw_expediente, str):
                havera = str(raw_expediente).strip().lower() in ['true', '1', 'sim', 's', 'yes', 'y', 'aberto']
            else:
                havera = bool(raw_expediente)

            normalized_data = {
                "nome": str(raw_nome).strip(),
                "data": str(raw_data).strip(),
                "tipo": str(raw_tipo).strip().upper() if raw_tipo else "FEDERAL",
                "havera_expediente": havera,
                "tenant_id": tenant_id
            }

            try:
                holiday_in = HolidayCreate(**normalized_data)
                
                exists = db.query(Holiday).filter(Holiday.tenant_id == tenant_id, Holiday.data == holiday_in.data).first()
                if exists:
                    row.status = ImportRowStatus.DUPLICATED
                    row.error_message = f"Já existe um feriado para a data {holiday_in.data}."
                    db.add(row)
                    continue

                row.status = ImportRowStatus.VALID
                row.error_message = None
                row.raw_data = holiday_in.model_dump(mode="json")

            except ValidationError as e:
                row.status = ImportRowStatus.INVALID
                errors = [f"Campo '{err['loc'][0]}': Verifique o formato." for err in e.errors()]
                row.error_message = " | ".join(errors)

            db.add(row)

    batch.status = ImportBatchStatus.WAITING_APPROVAL
    db.commit()
    db.refresh(batch)
    return batch

def promote_import_batch(db: Session, batch_id: UUID, tenant_id: UUID):
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id, ImportBatch.tenant_id == tenant_id).first()
    if not batch or batch.status != ImportBatchStatus.WAITING_APPROVAL: return False, 0

    valid_rows = db.query(ImportRow).filter(ImportRow.batch_id == batch_id, ImportRow.status == ImportRowStatus.VALID).all()
    count = 0

    if batch.entity_type == ImportEntityType.CUSTOMER:
        customers_to_insert = [Customer(**row.raw_data) for row in valid_rows]
        db.add_all(customers_to_insert)
        count = len(customers_to_insert)

    elif batch.entity_type == ImportEntityType.HOLIDAY:
        holidays_to_insert = [Holiday(**row.raw_data) for row in valid_rows]
        db.add_all(holidays_to_insert)
        count = len(holidays_to_insert)

    db.commit()
    db.delete(batch)
    db.commit()

    return True, count
