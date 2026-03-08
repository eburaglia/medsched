from sqlalchemy import text
from src.database import SessionLocal

def fix_db():
    db = SessionLocal()
    try:
        db.execute(text("""
        CREATE TABLE IF NOT EXISTS service_resources (
            service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
            PRIMARY KEY (service_id, resource_id)
        );
        """))
        db.commit()
        print("✅ Tabela de relacionamento Serviços <-> Recursos criada com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao atualizar o banco: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_db()
