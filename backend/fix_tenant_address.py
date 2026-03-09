from sqlalchemy import text
from src.database import SessionLocal

def fix_tenant_db():
    db = SessionLocal()
    columns = [
        ("endereco_cep", "VARCHAR(20)"),
        ("endereco_numero", "VARCHAR(50)"),
        ("endereco_bairro", "VARCHAR(100)")
    ]
    
    try:
        for col_name, col_type in columns:
            db.execute(text(f"ALTER TABLE tenants ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
        print("✅ Colunas CEP, Número e Bairro criadas/verificadas com sucesso na tabela: tenants")
        db.commit()
    except Exception as e:
        print(f"❌ Erro ao alterar banco de dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_tenant_db()
