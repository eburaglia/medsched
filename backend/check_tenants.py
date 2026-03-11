from src.database import SessionLocal
from src.models.tenant import Tenant

db = SessionLocal()
tenants = db.query(Tenant).all()
print("--- RAIO-X DOS TENANTS NO BANCO ---")
for t in tenants:
    print(f"Nome: {t.nome} | ID: {t.id} | Codigo: {t.codigo_visual} | Status: {t.status} | Deletado em: {t.deletado_em}")
