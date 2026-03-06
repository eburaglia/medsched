from sqlalchemy import text
from src.database import SessionLocal

db = SessionLocal()
try:
    db.execute(text("UPDATE customers SET status = 'ATIVO' WHERE status::text = 'ativo'"))
    db.execute(text("UPDATE customers SET status = 'INATIVO' WHERE status::text = 'inativo'"))
    db.commit()
    print("✅ Status dos clientes antigos atualizados para MAIÚSCULO com sucesso!")
except Exception as e:
    print(f"Erro: {e}")
finally:
    db.close()
