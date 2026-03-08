import sys
from datetime import datetime, timedelta
from passlib.context import CryptContext
from src.database import SessionLocal
from src.models.user import User, UserStatus, UserRole
from src.models.tenant import Tenant, TenantStatus

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def run_seed():
    db = SessionLocal()
    try:
        # 1. Cria a Clínica respeitando 100% das constraints (nullable=False)
        t = Tenant(
            status=TenantStatus.ATIVO,
            nome="Clínica Master (Seed)",
            segmento_atuacao="Saúde e Bem-estar",
            fuso_horario="America/Sao_Paulo",
            endereco_logradouro="Avenida Paulista, 1000",
            endereco_cidade="São Paulo",
            endereco_estado="SP",
            endereco_regiao="Sudeste",
            site_url="https://clinicamaster.com.br",
            email_contato="contato@clinicamaster.com.br",
            telefone_contato="(11) 99999-9999",
            dominio_interno="clinica-master-seed",
            url_externa="https://app.medsched.com/clinica-master",
            logotipo_url="https://bucket.s3/logo-master.png",
            validade_assinatura=datetime.utcnow() + timedelta(days=365) # 1 ano de assinatura
        )
        db.add(t)
        db.flush() # Salva no banco e pega o ID sem fechar a transação

        # 2. Cria o Usuário Mestre vinculado ao ID gerado acima
        u = User(
            tenant_id=t.id,
            nome="Dr. Admin",
            email="admin@clinica.com",
            senha_hash=pwd_context.hash("123456"),
            status=UserStatus.ATIVO,
            papel=UserRole.TENANT_ADMIN
        )
        db.add(u)
        db.commit() # Comita Tenant e User juntos (Transação Atômica)
        
        print("\n" + "="*50)
        print("✅ SUCESSO! FUNDAÇÃO E ACESSO MESTRE CRIADOS.")
        print("📧 Email de Login: admin@clinica.com")
        print("🔑 Senha: 123456")
        print("="*50 + "\n")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro durante a inserção: {e}\n")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
