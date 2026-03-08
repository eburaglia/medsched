import uuid
from datetime import datetime
from src.database import SessionLocal
from src.models.super_admin import SuperAdmin, SuperAdminStatus
from src.core.security import get_password_hash

def create_first_super_admin():
    db = SessionLocal()
    try:
        email_admin = "admin@medsched.com"
        senha_admin = "Admin@123"
        
        # Verifica se já existe para não duplicar
        existing = db.query(SuperAdmin).filter(SuperAdmin.email == email_admin).first()
        if existing:
            print(f"⚠️ O Super Admin '{email_admin}' já existe no banco.")
            return

        # Cria o Super Admin
        novo_admin = SuperAdmin(
            id=uuid.uuid4(),
            nome="Administrador do Sistema",
            email=email_admin,
            senha_hash=get_password_hash(senha_admin),
            status=SuperAdminStatus.ATIVO,
            criado_em=datetime.utcnow()
        )
        
        db.add(novo_admin)
        db.commit()
        print("✅ Super Admin criado com sucesso!")
        print("-------------------------------------------------")
        print(f"📧 Login: {email_admin}")
        print(f"🔑 Senha: {senha_admin}")
        print("-------------------------------------------------")
        
    except Exception as e:
        print(f"❌ Erro ao criar Super Admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_first_super_admin()
