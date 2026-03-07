from sqlalchemy import text
from src.database import SessionLocal

def fix_appointments_table():
    db = SessionLocal()
    try:
        # Adiciona as colunas apenas se elas não existirem
        db.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS criado_por UUID;"))
        db.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS alterado_por UUID;"))
        db.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP WITHOUT TIME ZONE;"))
        db.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deletado_por UUID;"))
        db.commit()
        print("✅ Colunas de auditoria adicionadas com sucesso à tabela appointments!")
    except Exception as e:
        print(f"❌ Erro ao atualizar o banco: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_appointments_table()
