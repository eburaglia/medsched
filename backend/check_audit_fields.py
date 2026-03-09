from sqlalchemy import text
from src.database import SessionLocal

def check_db():
    db = SessionLocal()
    try:
        # Busca o nome e os campos de auditoria de todos os usuários
        result = db.execute(text("SELECT nome, criado_por, alterado_por, deletado_por FROM users;"))
        
        print("\n" + "="*85)
        print(f"{'NOME DO USUÁRIO':<30} | {'CRIADO POR':<15} | {'ALTERADO POR':<15} | {'DELETADO POR':<15}")
        print("="*85)
        
        for row in result:
            nome = str(row[0])[:29]
            criado_por = str(row[1]) if row[1] else "NULL"
            alterado_por = str(row[2]) if row[2] else "NULL"
            deletado_por = str(row[3]) if row[3] else "NULL"
            
            print(f"{nome:<30} | {criado_por:<15} | {alterado_por:<15} | {deletado_por:<15}")
            
        print("="*85 + "\n")
        
    except Exception as e:
        print(f"❌ Erro ao consultar o banco: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
