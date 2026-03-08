from sqlalchemy import text
from src.database import SessionLocal

def fix_db():
    db = SessionLocal()
    tables = ["users", "customers"]
    columns = [
        ("endereco_cep", "VARCHAR(20)"),
        ("endereco_logradouro", "VARCHAR(255)"),
        ("endereco_numero", "VARCHAR(50)"),
        ("endereco_bairro", "VARCHAR(255)"),
        ("endereco_cidade", "VARCHAR(100)"),
        ("endereco_estado", "VARCHAR(2)")
    ]
    
    try:
        for table in tables:
            for col_name, col_type in columns:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
            print(f"✅ Colunas de endereço verificadas/criadas na tabela: {table}")
        db.commit()
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_db()
