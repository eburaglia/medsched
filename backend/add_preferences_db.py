from sqlalchemy import text
from src.database import SessionLocal

def fix_db():
    db = SessionLocal()
    try:
        # Usamos JSONB porque o PostgreSQL é super otimizado para isso
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferencias_ui JSONB;"))
        db.commit()
        print("✅ Coluna 'preferencias_ui' adicionada com sucesso na tabela users!")
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_db()
