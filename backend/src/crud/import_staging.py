from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID
from pydantic import ValidationError

from src.models.import_staging import ImportBatch, ImportRow, ImportBatchStatus, ImportRowStatus, ImportEntityType
from src.schemas.import_staging import ImportBatchCreate

# 👇 Importações para o Inspetor ler as regras de Cliente
from src.models.customer import Customer
from src.schemas.customer import CustomerCreate

def create_import_batch(db: Session, obj_in: ImportBatchCreate) -> ImportBatch:
    """Cria o cabeçalho (O Lote) do arquivo importado"""
    db_obj = ImportBatch(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def create_import_rows(db: Session, batch_id: UUID, rows_data: List[Dict[str, Any]]):
    """
    Recebe as linhas fatiadas do Excel e salva todas de uma vez no banco usando JSONB.
    """
    import_rows = []
    for index, row_dict in enumerate(rows_data):
        # index começa em 0. +2 porque a linha 1 do Excel é o cabeçalho, então os dados começam na 2.
        import_rows.append(
            ImportRow(
                batch_id=batch_id,
                row_number=index + 2, 
                raw_data=row_dict
            )
        )
    
    # Bulk Insert: Salva centenas/milhares de linhas em uma única viagem ao banco!
    db.add_all(import_rows)
    db.commit()

# ==========================================
# 🕵️ O INSPETOR DE QUALIDADE
# ==========================================
def validate_import_batch(db: Session, batch_id: UUID, tenant_id: UUID) -> ImportBatch | None:
    """
    Inspeciona linha por linha da Staging Area, aplica regras de negócio e marca como VALIDO, INVALIDO ou DUPLICADO.
    """
    # 1. Busca o Lote
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id, ImportBatch.tenant_id == tenant_id).first()
    if not batch:
        return None

    # Muda o status para "Processando"
    batch.status = ImportBatchStatus.PROCESSING
    db.commit()

    # 2. Busca todas as linhas amarradas a esse lote
    rows = db.query(ImportRow).filter(ImportRow.batch_id == batch_id).all()

    for row in rows:
        raw = row.raw_data
        
        # 🟢 LÓGICA DE VALIDAÇÃO PARA CLIENTES (CUSTOMERS)
        if batch.entity_type == ImportEntityType.CUSTOMER:
            
            # A. Normalização (Arrumando as bagunças comuns do Excel)
            raw_nome = raw.get("nome") or raw.get("Nome") or ""
            raw_email = raw.get("email") or raw.get("e-mail") or raw.get("E-mail")
            raw_telefone = raw.get("telefone") or raw.get("Telefone")

            normalized_data = {
                "nome": str(raw_nome).strip(),
                "tenant_id": tenant_id
            }

            # Só adiciona email e telefone se vieram na planilha
            if raw_email:
                normalized_data["email"] = str(raw_email).strip()
            if raw_telefone:
                normalized_data["telefone"] = str(raw_telefone).strip()

            try:
                # B. Validação Estrutural (O Pydantic aprova as regras de tamanho e formato?)
                customer_in = CustomerCreate(**normalized_data)

                # C. Regra de Negócio: Já existe alguém com esse e-mail na clínica?
                if customer_in.email:
                    exists = db.query(Customer).filter(
                        Customer.tenant_id == tenant_id,
                        Customer.email == customer_in.email
                    ).first()

                    if exists:
                        row.status = ImportRowStatus.DUPLICATED
                        row.error_message = f"O e-mail '{customer_in.email}' já existe no banco de dados."
                        db.add(row)
                        continue # Pula para a próxima linha

                # D. Sucesso! A linha é perfeita.
                row.status = ImportRowStatus.VALID
                row.error_message = None
                
                # Atualiza o banco com a versão limpa e formatada pelo Pydantic!
                row.raw_data = customer_in.model_dump(mode="json") 

            except ValidationError as e:
                # E. Falha! O Pydantic rejeitou (ex: email sem @, nome vazio)
                row.status = ImportRowStatus.INVALID
                # Pega os erros do Pydantic e formata de um jeito legível
                errors = [f"Campo '{err['loc'][0]}': {err['msg']}" for err in e.errors()]
                row.error_message = " | ".join(errors)
            
            # Adiciona a linha modificada para salvar depois
            db.add(row)

    # 3. Terminou de ler todas as linhas. O Lote agora aguarda aprovação do Admin!
    batch.status = ImportBatchStatus.WAITING_APPROVAL
    db.commit()
    db.refresh(batch)
    return batch

# ==========================================
# 🚀 A PROMOÇÃO (O GRAN FINALE) - NOVO!
# ==========================================
def promote_import_batch(db: Session, batch_id: UUID, tenant_id: UUID):
    """
    Pega todas as linhas VALIDAS, insere na tabela oficial (ex: Customers) 
    e depois apaga fisicamente o lote da Staging Area.
    """
    # 1. Busca o Lote
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id, ImportBatch.tenant_id == tenant_id).first()
    
    # Se não existir ou não estiver aguardando aprovação, cancela.
    if not batch or batch.status != ImportBatchStatus.WAITING_APPROVAL:
        return False, 0

    # 2. Pega apenas as linhas que passaram no teste do Inspetor
    valid_rows = db.query(ImportRow).filter(
        ImportRow.batch_id == batch_id,
        ImportRow.status == ImportRowStatus.VALID
    ).all()

    count = 0

    # 3. Transforma o JSONB em Registros Oficiais
    if batch.entity_type == ImportEntityType.CUSTOMER:
        customers_to_insert = []
        for row in valid_rows:
            # Desempacota o JSON limpo direto para o modelo do SQLAlchemy
            customers_to_insert.append(Customer(**row.raw_data))
        
        # Insere todo mundo de uma vez (Performance extrema)
        db.add_all(customers_to_insert)
        count = len(customers_to_insert)

    # (No futuro, você pode adicionar 'elif' aqui para SERVICE, RESOURCE, etc.)

    # 4. Salva os clientes no banco oficial
    db.commit()

    # 5. A Limpeza (Como você solicitou: Apaga os rastros da Staging Area)
    # Como configuramos 'ondelete="CASCADE"', apagar o Lote apaga todas as linhas dele automaticamente.
    db.delete(batch)
    db.commit()

    return True, count
