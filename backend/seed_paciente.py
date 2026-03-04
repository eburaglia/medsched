import sys
import json
from datetime import datetime, timedelta
from src.database import SessionLocal
from src.models.user import User
from src.models.tenant import Tenant
from src.models.customer import Customer

def preparar_teste():
    db = SessionLocal()
    try:
        # 1. Busca as chaves do nosso cenário existente
        tenant = db.query(Tenant).filter_by(nome="Clínica Master (Seed)").first()
        profissional = db.query(User).filter_by(email="admin@clinica.com").first()
        
        if not tenant or not profissional:
            print("\n❌ Erro: Clínica ou Profissional base não encontrados.")
            return

        # 2. Cria o Paciente (apenas se não existir para não duplicar)
        cliente = db.query(Customer).filter_by(nome="Paciente João Silva", tenant_id=tenant.id).first()
        if not cliente:
            cliente = Customer(
                tenant_id=tenant.id,
                nome="Paciente João Silva",
                cpf_cnpj="11122233344",
                telefone="(11) 98888-7777"
            )
            db.add(cliente)
            db.commit()
            db.refresh(cliente)
        
        # 3. Monta as datas (Vamos projetar para começar amanhã às 14:00)
        amanha = datetime.now() + timedelta(days=1)
        data_inicio = amanha.replace(hour=14, minute=0, second=0, microsecond=0)
        data_fim = amanha.replace(hour=15, minute=0, second=0, microsecond=0)

        # 4. Gera o Payload perfeito para o Swagger
        payload = {
            "customer_id": str(cliente.id),
            "profissional_id": str(profissional.id),
            "tenant_id": str(tenant.id),
            "data_hora_inicio_base": data_inicio.isoformat(),
            "data_hora_fim_base": data_fim.isoformat(),
            "frequencia": "SEMANAL",
            "quantidade_sessoes": 5
        }

        print("\n" + "="*65)
        print("✅ PACIENTE CRIADO! AQUI ESTÁ O SEU JSON DE TESTE PARA O SWAGGER:")
        print("="*65)
        print(json.dumps(payload, indent=2))
        print("="*65 + "\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro: {e}\n")
    finally:
        db.close()

if __name__ == "__main__":
    preparar_teste()
